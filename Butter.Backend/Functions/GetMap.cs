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
    public static class GetMap
    {
        [FunctionName("GetMap")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = null)] HttpRequest req,
            [Blob("schemas/map.json")] CloudBlockBlob blob,
            ILogger log)
        {
            var content = await blob.DownloadTextAsync();
            var result = JsonConvert.DeserializeObject<IDictionary<string, string[]>>(content);

            return new OkObjectResult(result);
        }
    }
}
