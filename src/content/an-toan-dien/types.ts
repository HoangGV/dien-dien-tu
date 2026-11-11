import React from 'react';

export type SafetyTab = 'moinguy' | 'bienphap' | 'dungcu' | 'socuu' | 'kiemtra';
export type SafetySceneId = 'phong-khach' | 'bep-phong-tam' | 'ngoai-troi';

export interface SafetyHazard {
  id: string;
  name: string;
  sceneId: SafetySceneId;
  hotspot: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  };
  nguyenNhan: string;
  hauQua: string;
  phongTranh: string;
  simulationPresetId?: string; // e.g. 'hh_j', 'hh_k', 'hh_c', 'hh_o'
  simulationTitle?: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface SafetySceneDef {
  id: SafetySceneId;
  name: string;
  description: string;
  renderSVG: (
    hazards: SafetyHazard[],
    selectedHazardId: string | null,
    discoveredHazardIds: string[],
    hintHazardId: string | null,
    onSelectHazard: (id: string) => void
  ) => React.ReactNode;
  reviewStatus: 'cần GV đối chiếu';
}

export interface SafetyMeasure {
  id: string;
  title: string;
  description: string;
  hazardIds: string[]; // Links to SafetyHazard.id
  simulationPresetId?: string;
  simulationTitle?: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface SafetyTool {
  id: string;
  name: string;
  renderSVG: () => React.ReactNode;
  tacDung: string;
  cachDung: string;
  kiemTra: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface FirstAidStep {
  id: string;
  stepNumber: number; // 1 to 5 (correct order)
  title: string;
  content: string;
  explanation: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface ShouldOrNotQuestion {
  id: string;
  situation: string;
  correctAction: 'nen' | 'khong-nen';
  explanation: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reviewStatus: 'cần GV đối chiếu';
}

export interface SafetyWorkspaceState {
  activeTab: SafetyTab;
  activeSceneId: SafetySceneId;
  selectedHazardId: string | null;
  discoveredHazardIds: string[];
  firstAidStepIds: string[];
  firstAidChecked: boolean;
  firstAidShouldAnswers: Record<string, 'nen' | 'khong-nen'>;
  quizAnswers: Record<string, number>;
  quizScore: number | null;
  quizSubmitted: boolean;
  quizSeed?: number;
}
