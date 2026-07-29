# GET Let's use some attributes.

<APIEndpoint
  method={"GET"}
  path={"/attributes"}
  summary={"Let's use some attributes."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"query","in":"query","required":false,"description":"my input","schema":{"type":"string"}},{"name":"count","in":"query","required":false,"description":"","schema":{"type":"integer"}},{"name":"query","in":"query","required":false,"description":null,"schema":{"type":"string"}},{"name":"count","in":"query","required":false,"description":null,"schema":{"type":"string"}}]} />

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"version":{"type":"string"},"description":{},"termsOfService":{},"contact":{"properties":{"name":{},"url":{},"email":{}}},"license":{"properties":{"name":{"type":"string"},"url":{},"identifier":{}},"required":["name"]},"extensions":{}},"required":["title","version"]}}}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"title":{"type":"string"},"version":{"type":"string"},"description":{},"termsOfService":{},"contact":{"properties":{"name":{},"url":{},"email":{}}},"license":{"properties":{"name":{"type":"string"},"url":{},"identifier":{}},"required":["name"]},"extensions":{}},"required":["title","version"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/attributes"}
  parameters={[{"name":"query","in":"query","required":false,"description":"my input","schema":{"type":"string"}},{"name":"count","in":"query","required":false,"description":"","schema":{"type":"integer"}},{"name":"query","in":"query","required":false,"description":null,"schema":{"type":"string"}},{"name":"count","in":"query","required":false,"description":null,"schema":{"type":"string"}}]}
  requestBody={{"required":false,"description":"","contentType":"application/json","schema":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"version":{"type":"string"},"description":{},"termsOfService":{},"contact":{"properties":{"name":{},"url":{},"email":{}}},"license":{"properties":{"name":{"type":"string"},"url":{},"identifier":{}},"required":["name"]},"extensions":{}},"required":["title","version"]}}}}
  baseUrl={""}
/>

