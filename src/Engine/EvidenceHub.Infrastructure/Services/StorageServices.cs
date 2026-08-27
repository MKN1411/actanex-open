using Amazon.S3;
using Amazon.S3.Model;
using EvidenceHub.Domain.Interfaces;

namespace EvidenceHub.Infrastructure.Services;

/// <summary>
/// Lokaler Speicheradapter für Entwicklung und Testläufe.
/// </summary>
public class LocalStorageService : IStorageService
{
    private readonly string _baseDirectory;

    public LocalStorageService(string? baseDirectory = null)
    {
        _baseDirectory = baseDirectory ?? Path.Combine(AppContext.BaseDirectory, "storage");
        if (!Directory.Exists(_baseDirectory))
        {
            Directory.CreateDirectory(_baseDirectory);
        }
    }

    public async Task<string> UploadFileAsync(string storageKey, byte[] data, string contentType, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(data);
        var fullPath = Path.Combine(_baseDirectory, storageKey.Replace('/', Path.DirectorySeparatorChar));
        var dir = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        await File.WriteAllBytesAsync(fullPath, data, cancellationToken);
        return fullPath;
    }

    public async Task<byte[]> DownloadFileAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseDirectory, storageKey.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"File not found: {storageKey}");
        }

        return await File.ReadAllBytesAsync(fullPath, cancellationToken);
    }

    public Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseDirectory, storageKey.Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult(File.Exists(fullPath));
    }

    public Task DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = Path.Combine(_baseDirectory, storageKey.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
        return Task.CompletedTask;
    }
}

/// <summary>
/// Cloudflare R2 (S3-kompatibler) Speicheradapter für Belege und GoBD-PDFs.
/// Speziell optimiert für Cloudflare R2 S3-Kompatibilität (DisablePayloadSigning & UseChunkEncoding=false auf PutObjectRequest).
/// </summary>
public class R2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public R2StorageService(string accountId, string accessKeyId, string secretAccessKey, string bucketName)
    {
        _bucketName = bucketName ?? throw new ArgumentNullException(nameof(bucketName));
        
        var config = new AmazonS3Config
        {
            ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
            ForcePathStyle = true,
            SignatureVersion = "4"
        };

        _s3Client = new AmazonS3Client(accessKeyId, secretAccessKey, config);
    }

    public async Task<string> UploadFileAsync(string storageKey, byte[] data, string contentType, CancellationToken cancellationToken = default)
    {
        using var stream = new MemoryStream(data);
        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = storageKey,
            InputStream = stream,
            ContentType = contentType,
            DisablePayloadSigning = true,
            UseChunkEncoding = false
        };

        await _s3Client.PutObjectAsync(putRequest, cancellationToken);
        return storageKey;
    }

    public async Task<byte[]> DownloadFileAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var getRequest = new GetObjectRequest
        {
            BucketName = _bucketName,
            Key = storageKey
        };

        using var response = await _s3Client.GetObjectAsync(getRequest, cancellationToken);
        using var memoryStream = new MemoryStream();
        await response.ResponseStream.CopyToAsync(memoryStream, cancellationToken);
        return memoryStream.ToArray();
    }

    public async Task<bool> FileExistsAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(_bucketName, storageKey, cancellationToken);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task DeleteFileAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        try
        {
            await _s3Client.DeleteObjectAsync(_bucketName, storageKey, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // Already deleted
        }
    }
}
