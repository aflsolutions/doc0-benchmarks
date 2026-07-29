# GET CSV response

<APIEndpoint
  method={"GET"}
  path={"/content-types/csv"}
  summary={"CSV response"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/csv","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"CSV content"}
  contentType={"text/csv"}
  schema={{}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/content-types/csv"}
  parameters={[{"name":"Content-Type","in":"header","required":false,"description":"text/csv","schema":{"type":"string"}}]}
  baseUrl={""}
/>

