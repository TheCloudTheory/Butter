using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.WindowsAzure.Storage.Blob;
using System.Collections.Generic;

namespace Butter.Backend
{
    public static class GetContents
    {
        [FunctionName("GetContent")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = "GetContent/{serviceId}/{version}")] HttpRequest req,
            [Blob("schemas/schemas/{version}_{serviceId}.json")] CloudBlockBlob blob,
            string serviceId,
            string version,
            ILogger log)
        {
            // Throttle requests per client IP
            var content = await blob.DownloadTextAsync();

            return new OkObjectResult(content);
        }
    }
}
