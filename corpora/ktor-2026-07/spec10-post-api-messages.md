# POST Save a new message.

<APIEndpoint
  method={"POST"}
  path={"/api/messages"}
  summary={"Save a new message."}
  deprecated={false}
  baseUrl={""}
/>

## Request Body

The message to save.

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
  path={"/api/messages"}
  parameters={[]}
  requestBody={{"required":false,"description":"The message to save.","contentType":"application/json","schema":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}}
  baseUrl={""}
/>

