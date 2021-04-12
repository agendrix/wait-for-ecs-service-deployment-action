import { DeploymentOutcome, DeploymentStatus, RolloutState } from "../src/ecs/types";
import fetchDeployments from "../src/ecs/fetchDeployments";
import waitForDeploymentOutcome from "../src/ecs/waitForDeploymentOutcome";
import isServiceStable from "../src/ecs/isServiceStable";

jest.mock("../src/ecs/fetchDeployments");
let mockedFetchDeployments = fetchDeployments as jest.Mock;

jest.mock("../src/ecs/isServiceStable");
const mockedIsServiceStable = isServiceStable as jest.Mock;
mockedIsServiceStable.mockReturnValue(true);

const TASK_DEFINITION_ARN = "arn:aws:ecs:region:<account-number>:task-definition/family:123";
const CLUSTER = "cluster";
const SERVICE = "service";

describe("waitForDeploymentOutcome", () => {
  afterEach(() => mockedFetchDeployments.mockRestore());

  test("It must return 'success' if deployment completes and service is stable", async () => {
    const deployment = {
      id: "1",
      status: DeploymentStatus.PRIMARY,
      taskDefinitionArn: TASK_DEFINITION_ARN,
      rolloutState: RolloutState.IN_PROGRESS
    };
    const initialDeploymentsState = [deployment];
    const finalDeploymentsState = [{ ...deployment, rolloutState: RolloutState.COMPLETED }];
    mockedFetchDeployments.mockReturnValueOnce(initialDeploymentsState).mockReturnValueOnce(finalDeploymentsState);
    expect(
      await waitForDeploymentOutcome(
        CLUSTER,
        SERVICE,
        TASK_DEFINITION_ARN,
        setTimeout(() => {}),
        1
      )
    ).toBe(DeploymentOutcome.SUCCESS);
    mockedFetchDeployments.mockRestore();
  });

  test("It must handle two ongoing deployments with same task definition (force new deployment)", async () => {
    const deploymentA = {
      id: "1",
      status: DeploymentStatus.PRIMARY,
      taskDefinitionArn: TASK_DEFINITION_ARN,
      rolloutState: RolloutState.IN_PROGRESS
    };
    const initialDeploymentsState = [{ ...deploymentA }];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(initialDeploymentsState);

    deploymentA.status = DeploymentStatus.ACTIVE;
    const deploymentB = {
      id: "2",
      status: DeploymentStatus.PRIMARY,
      taskDefinitionArn: TASK_DEFINITION_ARN,
      rolloutState: RolloutState.IN_PROGRESS
    };
    const middleDeploymentState = [{ ...deploymentA }, { ...deploymentB }];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(middleDeploymentState);

    deploymentB.rolloutState = RolloutState.COMPLETED;
    const finalDeploymentsState = [{ ...deploymentA }, { ...deploymentB }];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(finalDeploymentsState);

    expect(
      await waitForDeploymentOutcome(
        CLUSTER,
        SERVICE,
        TASK_DEFINITION_ARN,
        setTimeout(() => {}),
        1
      )
    ).toBe(DeploymentOutcome.SUCCESS);
  });

  test("It must return 'skipped' if another deployment is enqueued", async () => {
    const deploymentA = {
      id: "1",
      status: DeploymentStatus.PRIMARY,
      taskDefinitionArn: TASK_DEFINITION_ARN,
      rolloutState: RolloutState.IN_PROGRESS
    };
    const initialDeploymentsState = [{ ...deploymentA }];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(initialDeploymentsState);

    deploymentA.status = DeploymentStatus.ACTIVE;
    const deploymentB = {
      id: "2",
      status: DeploymentStatus.PRIMARY,
      taskDefinitionArn: TASK_DEFINITION_ARN.slice(0, -1),
      rolloutState: RolloutState.IN_PROGRESS
    };
    const finalDeploymentsState = [{ ...deploymentA }, { ...deploymentB }];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(finalDeploymentsState);

    expect(
      await waitForDeploymentOutcome(
        CLUSTER,
        SERVICE,
        TASK_DEFINITION_ARN,
        setTimeout(() => {}),
        1
      )
    ).toBe(DeploymentOutcome.SKIPPED);
  });

  test("It must timeout service deployment never becomes stable", async () => {
    const deployments = [
      {
        id: "1",
        status: DeploymentStatus.PRIMARY,
        taskDefinitionArn: TASK_DEFINITION_ARN,
        rolloutState: RolloutState.IN_PROGRESS
      }
    ];
    mockedFetchDeployments = mockedFetchDeployments.mockReturnValueOnce(deployments);
    expect(async () => {
      const deploymentTimeout = setTimeout(() => {
        throw new Error("timeout");
      }, 1000);
      try {
        await waitForDeploymentOutcome(CLUSTER, SERVICE, TASK_DEFINITION_ARN, deploymentTimeout);
      } catch (e) {
        expect(e).toMatch("timeout");
      }
    });
  });
});
