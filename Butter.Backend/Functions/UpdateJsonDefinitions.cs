using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Microsoft.WindowsAzure.Storage.Blob;
using Newtonsoft.Json;

namespace Butter.Backend
{
    public static class Functions
    {
        [FunctionName("UpdateJsonDefinitions")]
        public static async Task Run(
            [TimerTrigger("0 0 8 * * *")] TimerInfo myTimer,
            [Blob("schemas")] CloudBlobContainer container,
            ILogger log)
        {
            await container.CreateIfNotExistsAsync();

            var http = new Http(log);
            var map = new Dictionary<string, List<string>>();
            var schemas = await http.GetSchemas();

            foreach (var schema in schemas)
            {
                log.LogInformation("Fetching schema {0}", schema.Name);
                var contents = await http.GetContent(schema.Path);
                foreach (var content in contents)
                {
                    try
                    {
                        log.LogInformation("Fetching content for {0}, {1}", content.Path, content.Name);
                        var file = await http.GetFileContent($"{schema.Path}/{content.Name}");
                        var decodedFile = Encoding.UTF8.GetString(Convert.FromBase64String(file.Content));

                        var blob = container.GetBlockBlobReference($"{schema.Path}_{content.Name}");
                        await blob.UploadTextAsync(decodedFile);

                        var mapKey = content.Name.Replace(".json", "");
                        var mapValue = schema.Path.Split('/')[1];
                        if (map.ContainsKey(mapKey))
                        {
                            map[mapKey].Add(mapValue);
                        }
                        else
                        {
                            map[mapKey] = new List<string> {
                             mapValue
                         };
                        }
                    }
                    catch (Exception ex)
                    {
                        log.LogError(ex, "Failed to fetch content: {0}", ex.Message);
                    }
                }
            }

            var mapBlob = container.GetBlockBlobReference("map.json");
            await mapBlob.UploadTextAsync(JsonConvert.SerializeObject(map));
        }
    }
}
