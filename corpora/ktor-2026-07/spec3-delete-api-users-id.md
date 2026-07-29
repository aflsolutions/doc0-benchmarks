# DELETE Delete a user.

<APIEndpoint
  method={"DELETE"}
  path={"/api/users/{id}"}
  summary={"Delete a user."}
  deprecated={false}
  baseUrl={""}
/>

## Parameters

<APIParameters parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"integer"}}]} />

## Responses

<APIResponse
  statusCode={"204"}
  description={"The user was deleted"}
/>

<APIResponse
  statusCode={"400"}
  description={"Bad ID argument"}
/>

## Try It

<APIPlayground
  method={"DELETE"}
  path={"/api/users/{id}"}
  parameters={[{"name":"id","in":"path","required":true,"description":"The ID of the user","schema":{"type":"integer"}}]}
  baseUrl={""}
/>

