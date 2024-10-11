# Wait for an ECS service deployment to complete

Wait for an ECS service rolling update to complete and output the outcome. This action only supports [ECS rolling updates](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-type-ecs.html).

## Requirements

This actions requires that the `aws-cli` is already configured. The official AWS action could be useful that achieve this configuration. Please refer to: [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) for further details.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
deploy-ecs-service-task-definition:
  name: Deploy <SERVICE> service
  runs-on: ubuntu-latest

  steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Deploy service to Amazon ECS
        id: deploy-task-definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          cluster: ${{ env.CLUSTER_NAME }}
          service: ${{ env.SERVICE_NAME }}
          task-definition: ${{ env.TASK_DEFINITION }}
          wait-for-service-stability: false

      - name: Wait for ${{ env.SERVICE_NAME }} service deployment to complete
        id: wait-for-ecs-service-deployment
        uses: agendrix/wait-for-ecs-service-deployment-action@<VERSION>
        with:
          cluster: ${{ env.CLUSTER_NAME }}
          service: ${{ env.SERVICE_NAME }}
          task-definition-arn: steps.deploy-task-definition.outputs.task-definition-arn
          deployment-timeout-minutes: ${{ env.SERVICE_DEPLOYMENT_TIMEOUT }}
```
