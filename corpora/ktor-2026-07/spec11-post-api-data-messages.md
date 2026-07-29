# POST Create Messages

<APIEndpoint
  method={"POST"}
  path={"/api/data/messages"}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

<APIRequestBody
  contentType={"application/json"}
  required={false}
  schema={{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}
/>

## Responses

<APIResponse
  statusCode={"201"}
  description={""}
/>

## Try It

<APIPlayground
  method={"POST"}
  path={"/api/data/messages"}
  parameters={[]}
  requestBody={{"required":false,"description":null,"contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}}
  baseUrl={""}
/>

