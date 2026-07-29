# GET Get a single message

<APIEndpoint
  method={"GET"}
  path={"/api/messages/{id}"}
  summary={"Get a single message"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the message","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={""}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"}},"required":["id","text"]}}
/>

<APIResponse
  statusCode={"404"}
  description={"The message was not found"}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/api/messages/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the message","schema":{"type":"string"}}]}
  baseUrl={""}
/>

