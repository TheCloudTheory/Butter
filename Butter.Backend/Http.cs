using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Butter.Backend
{
    public class Http {
        private const string BaseGitHubUrl = "https://api.github.com/";

        private static readonly Lazy<HttpClient> Client = new Lazy<HttpClient>(() => new HttpClient() {
            DefaultRequestHeaders = {
                {"User-Agent", "TheCloudTheory/Butter"}
            }
        });

        public static async Task<IEnumerable<SchemaMetadata>> GetSchemas() {
            var schemas = await Get<IEnumerable<SchemaMetadata>>($"{BaseGitHubUrl}repos/Azure/azure-resource-manager-schemas/contents/schemas");
            return schemas;
        }

        public static async Task<IEnumerable<SchemaMetadata>> GetContent(string path) {
            var content = await Get<IEnumerable<SchemaMetadata>>($"{BaseGitHubUrl}repos/Azure/azure-resource-manager-schemas/contents/{path}");
            return content;
        }

        public static async Task<File> GetFileContent(string path) {
            var file = await Get<File>($"{BaseGitHubUrl}repos/Azure/azure-resource-manager-schemas/contents/{path}");
            return file;
        }

        private static async Task<T> Get<T>(string url) {
            var clientId = Environment.GetEnvironmentVariable("CLIENT_ID");
            var clientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET");

            var response = await Client.Value.GetAsync($"{url}?client_id={clientId}&client_secret={clientSecret}");
            var result = JsonConvert.DeserializeObject<T>(await response.Content.ReadAsStringAsync());

            return result;
        }
    }
}