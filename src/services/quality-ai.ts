// Quality_ai service layer.
//
// DEV_MODE: this build ships a *mock* planner/generator so the whole journey is
// testable. The exported interface is the contract a real AI backend must
// implement later (a server function calling an AI gateway).

import type { MessageMeta, ProjectType, StageState } from "./types";

export const QUALITY_AI_NAME = "Quality_ai";
export const IS_MOCK_AI = true;

export interface AiPlan {
  projectName: string;
  projectType: ProjectType;
  steps: string[];
  etaSeconds: number;
  isEdit: boolean;
}

export interface QualityAiService {
  plan(prompt: string, existingProjectName?: string): Promise<AiPlan>;
  generateFiles(plan: AiPlan): Promise<{ path: string; content: string; language: string }[]>;
}

const GAME_WORDS = ["لعبة", "لعبه", "game", "ثلاثية", "3d", "سيارات", "مغامرة"];
const EDIT_WORDS = ["أضف", "اضف", "غيّر", "غير", "عدّل", "عدل", "احذف", "اجعل", "حسّن", "حسن"];

function pickName(prompt: string, fallback: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  const words = clean.split(" ").slice(0, 5).join(" ");
  return words.length > 3 ? words.slice(0, 40) : fallback;
}

export function isEditPrompt(prompt: string): boolean {
  return EDIT_WORDS.some((w) => prompt.trim().startsWith(w) || prompt.includes(` ${w} `));
}

export const BUILD_STAGES: { key: string; label: string }[] = [
  { key: "analyze", label: "تحليل الطلب" },
  { key: "structure", label: "إنشاء بنية المشروع" },
  { key: "files", label: "إنشاء الملفات" },
  { key: "code", label: "كتابة الكود" },
  { key: "validate", label: "فحص الأخطاء" },
  { key: "build", label: "بناء المشروع" },
  { key: "apk", label: "تجهيز APK" },
];

export function stagesAt(index: number, failed = false): StageState[] {
  return BUILD_STAGES.map((s, i) => ({
    key: s.key,
    label: s.label,
    state:
      i < index ? "done" : i === index ? (failed ? "failed" : "running") : "waiting",
  }));
}

export function allStagesDone(): StageState[] {
  return BUILD_STAGES.map((s) => ({ key: s.key, label: s.label, state: "done" as const }));
}

export function progressMeta(index: number, elapsed: number, eta: number): MessageMeta {
  return { kind: "progress", stages: stagesAt(index), elapsedSeconds: elapsed, etaSeconds: eta };
}

export const mockQualityAi: QualityAiService = {
  async plan(prompt, existingProjectName) {
    const isGame = GAME_WORDS.some((w) => prompt.toLowerCase().includes(w));
    const isEdit = Boolean(existingProjectName) && isEditPrompt(prompt);
    const steps = isEdit
      ? ["تحليل التعديل المطلوب", "تحديث الملفات المتأثرة", "فحص المشروع", "بناء إصدار جديد"]
      : isGame
        ? [
            "واجهة اللعبة",
            "محرك المشهد والحركة",
            "نظام المهام",
            "الأصوات والأصول",
            "الحفظ والتقدم",
            "ملفات المشروع",
            "إعداد Android",
          ]
        : [
            "واجهة المستخدم",
            "نظام تسجيل الدخول",
            "قاعدة البيانات",
            "الصفحات الرئيسية",
            "الإعدادات",
            "ملفات المشروع",
            "إعداد Android",
          ];

    return {
      projectName: existingProjectName ?? pickName(prompt, isGame ? "مشروع لعبة" : "مشروع تطبيق"),
      projectType: isGame ? "game" : "app",
      steps,
      // DEV_MODE: matches the mock build duration; a real build server reports its own ETA.
      etaSeconds: isGame ? 18 : 14,
      isEdit,
    };
  },

  async generateFiles(plan) {
    const pkg = plan.projectType === "game" ? "game" : "app";
    return [
      {
        path: "android/app/src/main/AndroidManifest.xml",
        language: "xml",
        content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aymtub.${pkg}">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="${plan.projectName}"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      },
      {
        path: "android/app/src/main/java/com/aymtub/MainActivity.kt",
        language: "kotlin",
        content: `package com.aymtub.${pkg}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}
`,
      },
      {
        path: "android/app/build.gradle",
        language: "gradle",
        content: `plugins { id 'com.android.application'; id 'kotlin-android' }

android {
    namespace 'com.aymtub.${pkg}'
    compileSdk 34
    defaultConfig {
        applicationId "com.aymtub.${pkg}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }
}
`,
      },
      {
        path: "android/settings.gradle",
        language: "gradle",
        content: `rootProject.name = "${plan.projectName}"\ninclude ':app'\n`,
      },
      {
        path: "app/src/screens/HomeScreen.kt",
        language: "kotlin",
        content: `// ${plan.projectName} — الشاشة الرئيسية\n// وُلّدت بواسطة Quality_ai\n\nfun homeSections(): List<String> = listOf(\n${plan.steps
          .map((s) => `    "${s}"`)
          .join(",\n")}\n)\n`,
      },
      {
        path: "assets/README.md",
        language: "markdown",
        content: `# الأصول\n\nضع هنا الصور والخطوط والأيقونات الخاصة بمشروع ${plan.projectName}.\n`,
      },
      {
        path: "README.md",
        language: "markdown",
        content: `# ${plan.projectName}\n\nمشروع Android وُلّد بواسطة Quality_ai داخل AYMTUB.\n\n## المكوّنات\n${plan.steps
          .map((s) => `- ${s}`)
          .join("\n")}\n`,
      },
    ];
  },
};
