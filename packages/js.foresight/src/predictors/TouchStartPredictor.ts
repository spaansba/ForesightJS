import { BasePredictor, type PredictorDependencies } from "./BasePredictor"

export class TouchStartPredictor extends BasePredictor {
  private intersectionObserver: IntersectionObserver | null = null

  constructor(dependencies: PredictorDependencies) {
    super(dependencies)
  }
  protected initializeListeners(): void {
    // This predictor does not need to initialize any listeners
    // as it is used for touch start predictions only
  }
  public connect(): void {}
  public disconnect(): void {}
  public cleanup(): void {}
}
