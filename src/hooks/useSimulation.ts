import { useState, useEffect } from 'react';
import { simulationManager, SimulationState } from '../stores/simulationStore';

export function useSimulation(): SimulationState {
  const [state, setState] = useState<SimulationState>(() => simulationManager.getState());

  useEffect(() => {
    const unsubscribe = simulationManager.subscribe(() => {
      // Create new shallow copy so React detects state update
      setState({ ...simulationManager.getState() });
    });
    return unsubscribe;
  }, []);

  return state;
}
