enum DeploymentStatus {
  PRIMARY = "PRIMARY", // The most recent deployment of a service
  ACTIVE = "ACTIVE", // A service deployment that still has running tasks, but are in the process of being replaced with a new PRIMARY deployment
  INACTIVE = "INACTIVE" // A deployment that has been completely replaced
}

enum RolloutState {
  IN_PROGRESS = "IN_PROGRESS", // New deployment is started
  COMPLETED = "COMPLETED", // Service reaches a steady state
  FAILED = "FAILED" // Service fails to reach a steady state and circuit breaker is enabled
}

enum DeploymentOutcome {
  SUCCESS = "success",
  SKIPPED = "skipped"
}

interface Deployment {
  id: string;
  status: string;
  taskDefinitionArn: string;
  rolloutState: string;
  createdAt: string;
}

interface Service {
  serviceName: string;
  deployments: Array<Deployment>;
  desiredCount: number;
  runningCount: number;
}

export { DeploymentStatus, RolloutState, Service, Deployment, DeploymentOutcome };
