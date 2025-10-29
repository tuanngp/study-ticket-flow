import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ticket type mapping utilities
 * Maps between UI-friendly names and database enum values
 */

// UI-friendly type names
export type UITicketType = 
  | "coding_error"
  | "project_setup"
  | "concept_question"
  | "grading_issue"
  | "system_issue"
  | "assignment"
  | "exam"
  | "submission"
  | "technical"
  | "academic"
  | "bug"
  | "feature"
  | "question"
  | "task"
  | "grading"
  | "report"
  | "config";

// Database enum type (from schema)
export type DatabaseTicketType =
  | "bug"
  | "feature"
  | "question"
  | "task"
  | "grading"
  | "report"
  | "config"
  | "assignment"
  | "exam"
  | "submission"
  | "technical"
  | "academic";

/**
 * Map UI-friendly type name to database enum value
 */
export function mapUITypeToDatabase(uiType: string): DatabaseTicketType {
  const typeMap: Record<string, DatabaseTicketType> = {
    "coding_error": "bug",
    "project_setup": "task",
    "concept_question": "question",
    "grading_issue": "grading",
    "system_issue": "report",
    // Direct mappings (already match database enum)
    "assignment": "assignment",
    "exam": "exam",
    "submission": "submission",
    "technical": "technical",
    "academic": "academic",
    "bug": "bug",
    "feature": "feature",
    "question": "question",
    "task": "task",
    "grading": "grading",
    "report": "report",
    "config": "config",
  };
  return typeMap[uiType] || (uiType as DatabaseTicketType);
}

/**
 * Normalize a type string - converts UI types to database enum or returns as-is if already a database enum
 */
export function normalizeTicketType(type: string): DatabaseTicketType {
  return mapUITypeToDatabase(type);
}