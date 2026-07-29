# GET Get Pets

<APIEndpoint
  method={"GET"}
  path={"/pets"}
  description={"Returns all pets from the system that the user has access to\nNam sed condimentum est. Maecenas tempor sagittis sapien, nec rhoncus sem sagittis sit amet. Aenean at gravida augue, ac iaculis sem. Curabitur odio lorem, ornare eget elementum nec, cursus id lectus. Duis mi turpis, pulvinar ac eros ac, tincidunt varius justo. In hac habitasse platea dictumst. Integer at adipiscing ante, a sagittis ligula. Aenean pharetra tempor ante molestie imperdiet. Vivamus id aliquam diam. Cras quis velit non tortor eleifend sagittis. Praesent at enim pharetra urna volutpat venenatis eget eget mauris. In eleifend fermentum facilisis. Praesent enim enim, gravida ac sodales sed, placerat id erat. Suspendisse lacus dolor, consectetur non augue vel, vehicula interdum libero. Morbi euismod sagittis libero sed lacinia.\n\nSed tempus felis lobortis leo pulvinar rutrum. Nam mattis velit nisl, eu condimentum ligula luctus nec. Phasellus semper velit eget aliquet faucibus. In a mattis elit. Phasellus vel urna viverra, condimentum lorem id, rhoncus nibh. Ut pellentesque posuere elementum. Sed a varius odio. Morbi rhoncus ligula libero, vel eleifend nunc tristique vitae. Fusce et sem dui. Aenean nec scelerisque tortor. Fusce malesuada accumsan magna vel tempus. Quisque mollis felis eu dolor tristique, sit amet auctor felis gravida. Sed libero lorem, molestie sed nisl in, accumsan tempor nisi. Fusce sollicitudin massa ut lacinia mattis. Sed vel eleifend lorem. Pellentesque vitae felis pretium, pulvinar elit eu, euismod sapien.\n"}
  deprecated={false}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

## Parameters

<APIParameters parameters={[{"name":"tags","in":"query","required":false,"description":"tags to filter by","schema":{"type":"array","items":{"type":"string"}}},{"name":"limit","in":"query","required":false,"description":"maximum number of results to return","schema":{"type":"integer","format":"int32"}}]} />

## Responses

<APIResponse
  statusCode={"200"}
  description={"pet response"}
  contentType={"application/json"}
  schema={{"type":"array","items":{}}}
/>

<APIResponse
  statusCode={"default"}
  description={"unexpected error"}
  contentType={"application/json"}
  schema={{"type":"object","properties":{"code":{"type":"integer","format":"int32"},"message":{"type":"string"}},"required":["code","message"]}}
/>

## Try It

<APIPlayground
  method={"GET"}
  path={"/pets"}
  parameters={[{"name":"tags","in":"query","required":false,"description":"tags to filter by","schema":{"type":"array","items":{"type":"string"}}},{"name":"limit","in":"query","required":false,"description":"maximum number of results to return","schema":{"type":"integer","format":"int32"}}]}
  baseUrl={"https://petstore.swagger.io/v2"}
/>

