# GET HTML response

<APIEndpoint
  method={"GET"}
  path={"/content-types/html"}
  summary={"HTML response"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/html","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"HTML content"}
  contentType={"text/html"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/content-types/html"}
  parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/html","schema":{"type":"string"}}]}
  baseUrl={""}
/>

