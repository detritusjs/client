
module.exports = {
    name: "Detritus",
    landingPage: "detritus-client",
    entryPoints: ["./utils/src/index", "./rest/src/index", "./client-rest/src/index", "./client-socket/src/index", "./src/index"],
    changelog: true,
    externals: [
        {
            baseName: "node-fetch",
            run: (name) => {
                name = name.name || name;
                switch(name) {
                    case "Request": return { link: "https://www.npmjs.com/package/node-fetch#class-request" };
                    case "Response": return { link: "https://www.npmjs.com/package/node-fetch#class-response" };
                    case "Headers": return { link: "https://www.npmjs.com/package/node-fetch#class-headers" };
                    case "Body": return { link: "https://www.npmjs.com/package/node-fetch#interface-body" };
                    case "Blob": return { link: "https://developer.mozilla.org/en-US/docs/Web/API/Blob" };
                }
            }
        },
        {
            baseName: "http",
            run: (name) => {
                name = name.name || name;
                switch(name) {
                    case "Agent": return { link: "https://nodejs.org/api/http.html#http_class_http_agent" };
                }
            }
        }
    ]
};