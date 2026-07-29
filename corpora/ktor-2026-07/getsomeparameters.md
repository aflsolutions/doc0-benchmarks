# GET Let's try some parameters.

<APIEndpoint
  method={"GET"}
  path={"/parameters/{id}"}
  summary={"Let's try some parameters."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The user ID","schema":{"type":"string"}},{"name":"X-Rate-Limit-Limit","in":"header","required":false,"description":"The number of allowed requests in the current period","schema":{"type":"integer"}},{"name":"token","in":"cookie","required":false,"description":"A token","schema":{"type":"string"}},{"name":"q","in":"query","required":false,"description":"A search query","schema":{"type":"string"}},{"name":"X-Type","in":"header","required":false,"description":"The type of a thing","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"204"}
  description={""}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/parameters/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The user ID","schema":{"type":"string"}},{"name":"X-Rate-Limit-Limit","in":"header","required":false,"description":"The number of allowed requests in the current period","schema":{"type":"integer"}},{"name":"token","in":"cookie","required":false,"description":"A token","schema":{"type":"string"}},{"name":"q","in":"query","required":false,"description":"A search query","schema":{"type":"string"}},{"name":"X-Type","in":"header","required":false,"description":"The type of a thing","schema":{"type":"string"}}]}
  baseUrl={""}
/>

