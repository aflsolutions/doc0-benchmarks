# GET Plain text response

<APIEndpoint
  method={"GET"}
  path={"/content-types/text"}
  summary={"Plain text response"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/plain","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"Plain text"}
  contentType={"text/plain"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/content-types/text"}
  parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/plain","schema":{"type":"string"}}]}
  baseUrl={""}
/>

