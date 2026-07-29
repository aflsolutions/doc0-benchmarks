# DELETE Delete a message.

<APIEndpoint
  method={"DELETE"}
  path={"/api/messages/{id}"}
  summary={"Delete a message."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the message","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"204"}
  description={""}
/>

## Try It

<APIPlayground
  method={"DELETE"}
  path={"/api/messages/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the message","schema":{"type":"string"}}]}
  baseUrl={""}
/>

