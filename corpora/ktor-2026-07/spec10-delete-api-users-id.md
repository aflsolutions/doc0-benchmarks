# DELETE Delete a user.

<APIEndpoint
  method={"DELETE"}
  path={"/api/users/{id}"}
  summary={"Delete a user."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"string"}}]} />

## Responses

<APIResponse
  statusCode={"204"}
  description={""}
/>

## Try It

<APIPlayground
  method={"DELETE"}
  path={"/api/users/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"string"}}]}
  baseUrl={""}
/>

