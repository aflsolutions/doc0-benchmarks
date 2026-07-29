# GET XML response

<APIEndpoint
  method={"GET"}
  path={"/content-types/xml"}
  summary={"XML response"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Content-Type","in":"header","required":false,"description":"application/xml","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"XML content"}
  contentType={"application/xml"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/content-types/xml"}
  parameters={[{"name":"Content-Type","in":"header","required":false,"description":"application/xml","schema":{"type":"string"}}]}
  baseUrl={""}
/>

