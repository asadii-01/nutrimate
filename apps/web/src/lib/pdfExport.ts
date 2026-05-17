/**
 * Builds the Settings → "Your data" export as a PDF report.
 *
 * The report bundles the user's profile, what each of the three ML models
 * (ANN / KNN / SVM) predicted for them plus the models' training accuracy,
 * and the last 7 days of logs. Rendered with jsPDF + jspdf-autotable.
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DaySummary, HealthRisk, Profile } from "@nutrimate/shared-types";
import type { CaloriePrediction } from "../features/predictions/predictions.api";
import type { MealPlan } from "../features/recommendations/recommendations.api";
import type { ModelMetrics } from "../features/models/models.api";
import { todayIso } from "./dates";
import {
  ACTIVITY_LABELS,
  BMI_LABELS,
  BUDGET_LABELS,
  DIET_LABELS,
  GENDER_LABELS,
  GOAL_LABELS,
  HEALTH_RISK_LABELS,
  MEAL_LABELS,
} from "./labels";

/** Everything the PDF needs. Every model field is nullable — a 404 (no
 * profile) or an offline ML service degrades gracefully to "Unavailable". */
export interface ExportData {
  email?: string;
  profile?: Profile;
  prediction: CaloriePrediction | null;
  plan: MealPlan | null;
  healthRisk: HealthRisk | null;
  metrics: ModelMetrics | null;
  days: DaySummary[];
}

const MARGIN = 40;
const PAGE_BOTTOM = 800;
const PRIMARY: [number, number, number] = [22, 163, 74];

type Row = (string | number)[];

/** jsPDF after a jspdf-autotable call exposes the table's end Y position. */
type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } };

const dash = "—";
const num = (n: number, digits = 0): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function buildExportPdf(data: ExportData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  // --- Header ---------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("NutriMate — Data Export", MARGIN, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(`Account: ${data.email ?? dash}`, MARGIN, y);
  y += 13;
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, y);
  y += 8;

  /** Draws a section heading, paginating first if the page is nearly full. */
  const heading = (title: string): void => {
    if (y > PAGE_BOTTOM - 60) {
      doc.addPage();
      y = MARGIN;
    }
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(title, MARGIN, y);
    y += 6;
  };

  /** Draws a table and advances `y` past it. */
  const table = (head: string[], body: Row[]): void => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: PRIMARY },
    });
    y = (doc as DocWithTable).lastAutoTable.finalY;
  };

  /** Draws a small italic note line under a table. */
  const note = (text: string): void => {
    y += 12;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(text, MARGIN, y);
  };

  // --- Profile --------------------------------------------------------------
  heading("Profile");
  const p = data.profile;
  if (p) {
    table(
      ["Field", "Value"],
      [
        ["Age", `${p.age}`],
        ["Gender", GENDER_LABELS[p.gender]],
        ["Height", `${p.heightCm} cm`],
        ["Weight", `${p.weightKg} kg`],
        ["Activity level", ACTIVITY_LABELS[p.activityLevel]],
        ["Goal", GOAL_LABELS[p.goal]],
        ["Diet preference", DIET_LABELS[p.dietPref]],
        ["Budget", p.budgetTier ? BUDGET_LABELS[p.budgetTier] : dash],
      ],
    );
  } else {
    table(["Field", "Value"], [["Profile", "Unavailable — set up your profile first."]]);
  }

  // --- ML model report ------------------------------------------------------
  heading("ML model report");

  // ANN — calorie prediction.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  y += 16;
  doc.text("ANN — calorie prediction", MARGIN, y);
  y += 4;
  const ann = data.metrics?.ann;
  const pred = data.prediction;
  table(
    ["Metric", "Value"],
    [
      ["Predicted calorie target", pred ? `${num(pred.calorieTarget)} kcal` : "Unavailable"],
      ["BMI", pred ? `${num(pred.bmi, 1)} (${BMI_LABELS[pred.bmiCategory]})` : "Unavailable"],
      ["Prediction source", pred ? pred.source.toUpperCase() : dash],
      ["Model version", pred?.modelVersion ?? ann?.modelVersion ?? dash],
      ["Accuracy — test MAE", ann ? `${num(ann.testMae, 2)} kcal` : "Unavailable"],
      [
        "Accuracy — mean deviation",
        ann?.meanDeviation !== undefined ? `${num(ann.meanDeviation, 2)} kcal` : dash,
      ],
    ],
  );

  // SVM — health risk.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  y += 16;
  doc.text("SVM — health-risk classification", MARGIN, y);
  y += 4;
  const svm = data.metrics?.svm;
  const risk = data.healthRisk;
  table(
    ["Metric", "Value"],
    [
      ["Predicted risk level", risk ? HEALTH_RISK_LABELS[risk.riskLevel] : "Unavailable"],
      [
        "Confidence",
        risk?.confidence != null ? `${num(risk.confidence * 100, 1)} %` : dash,
      ],
      ["Prediction source", risk ? risk.source.toUpperCase() : dash],
      ["Model version", risk?.modelVersion ?? svm?.modelVersion ?? dash],
      ["Accuracy — test accuracy", svm ? `${num(svm.testAccuracy * 100, 1)} %` : "Unavailable"],
      [
        "Accuracy — macro-F1",
        svm?.testMacroF1 !== undefined ? num(svm.testMacroF1, 3) : dash,
      ],
    ],
  );

  // KNN — meal recommendation (no accuracy metric by design).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  y += 16;
  doc.text("KNN — meal recommendation", MARGIN, y);
  y += 4;
  const knn = data.metrics?.knn;
  const plan = data.plan;
  table(
    ["Metric", "Value"],
    [
      ["Recommended plan total", plan ? `${num(plan.totalKcal)} kcal` : "Unavailable"],
      ["Calorie target", plan ? `${num(plan.calorieTarget)} kcal` : dash],
      ["Meals in plan", plan ? `${plan.meals.length}` : dash],
      ["Prediction source", plan ? plan.source.toUpperCase() : dash],
      ["Model version", plan?.modelVersion ?? knn?.modelVersion ?? dash],
      ["Neighbours (k)", knn?.k !== undefined ? `${knn.k}` : dash],
      ["Seed meal plans", knn?.planCount !== undefined ? `${knn.planCount}` : dash],
    ],
  );
  note(
    "The KNN is a deterministic nearest-neighbour recommender — it has no accuracy metric by design.",
  );

  // --- Recommended meals ----------------------------------------------------
  if (plan && plan.meals.length > 0) {
    heading("Recommended meals (KNN)");
    table(
      ["Meal", "Items", "kcal"],
      plan.meals.map((m) => [
        MEAL_LABELS[m.mealType],
        m.items.map((it) => `${it.name} ×${num(it.servings, 1)}`).join(", "),
        num(m.totalKcal),
      ]),
    );
  }

  // --- Last 7 days ----------------------------------------------------------
  heading("Last 7 days of logs");
  if (data.days.length > 0) {
    table(
      ["Date", "Target", "Consumed", "Protein", "Carbs", "Fats", "Water"],
      data.days.map((d) => [
        d.date,
        `${num(d.calorieTarget)} kcal`,
        `${num(d.consumedKcal)} kcal`,
        `${num(d.macros.protein)} g`,
        `${num(d.macros.carbs)} g`,
        `${num(d.macros.fats)} g`,
        `${num(d.waterMl)} ml`,
      ]),
    );
  } else {
    table(["Date", "Detail"], [["—", "No logs recorded in the last 7 days."]]);
  }

  doc.save(`nutrimate-export-${todayIso()}.pdf`);
}
