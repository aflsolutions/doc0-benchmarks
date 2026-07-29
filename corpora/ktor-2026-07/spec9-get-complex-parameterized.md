# GET Parameterized type responses

<APIEndpoint
  method={"GET"}
  path={"/complex/parameterized"}
  summary={"Parameterized type responses"}
  deprecated={false}
  baseUrl={""}
/>

## Responses

<APIResponse
  statusCode={"200"}
  description={"An ApiResponse parameterized with DudeDetails"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"data":{"type":"object","properties":{"dude":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}},"required":["id","name"]},"stats":{"type":"object","properties":{"posts":{"type":"integer"},"followers":{"type":"integer"},"following":{"type":"integer"}},"required":["posts","followers","following"]},"metadata":{"type":"object"}},"required":["dude","stats","metadata"]},"status":{"type":"string"},"timestamp":{"type":"string"}},"required":["data","status","timestamp"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/complex/parameterized"}
  parameters={[]}
  baseUrl={""}
/>

