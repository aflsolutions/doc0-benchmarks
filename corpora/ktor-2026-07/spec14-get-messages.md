# GET get messages

<APIEndpoint
  method={"GET"}
  path={"/messages"}
  summary={"get messages"}
  description={"Retrieves a list of messages."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"q","in":"query","required":false,"description":"An encoded query","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"A list of messages"}
  contentType={"application/yaml"}
  schema={{"type":"array","items":{"type":"object"}}}
/>

<APIResponse
  statusCode={"400"}
  description={"Invalid query"}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/messages"}
  parameters={[{"name":"q","in":"query","required":false,"description":"An encoded query","schema":{"type":"string"}}]}
  baseUrl={""}
/>

