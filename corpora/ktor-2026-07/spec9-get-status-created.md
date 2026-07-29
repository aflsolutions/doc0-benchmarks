# GET Created response

<APIEndpoint
  method={"GET"}
  path={"/status/created"}
  summary={"Created response"}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"Location","in":"header","required":false,"description":"URI of created resource","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"201"}
  description={"Resource created"}
  contentType={"application/json"}
  schema={{"type":"string"}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/status/created"}
  parameters={[{"name":"Location","in":"header","required":false,"description":"URI of created resource","schema":{"type":"string"}}]}
  baseUrl={""}
/>

