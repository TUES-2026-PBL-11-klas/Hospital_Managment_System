import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorsService } from '../doctors/doctors.service';
import type { AnalyzeSymptomInput } from '@medinest/trpc';

interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

interface LlmDiagnosisResult {
  specialty: string;
  confidence_score: number;
  reasoning: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'medinest-llama3';

@Injectable()
export class LlmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctorsService: DoctorsService,
  ) {}

  async analyzeSymptoms(userId: string, input: AnalyzeSymptomInput) {
    const patient = await this.prisma.patient.findFirst({ where: { userId } });
    if (!patient) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Patient profile not found' });
    }

    const prompt = this.buildPrompt(input.symptomsText);
    const llmResult = await this.callOllama(prompt);
    const availableDoctors = await this.doctorsService.findBySpecialty(llmResult.specialty);

    const symptomCheck = await this.prisma.symptomCheck.create({
      data: {
        patientId: patient.id,
        appointmentId: input.appointmentId,
        symptomsText: input.symptomsText,
        suggestedSpecialty: llmResult.specialty,
        confidenceScore: llmResult.confidence_score,
        llmReasoning: { reasoning: llmResult.reasoning },
        modelVersion: OLLAMA_MODEL,
      },
    });

    return { symptomCheck, availableDoctors };
  }

  async getSymptomHistory(patientId: string) {
    return this.prisma.symptomCheck.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildPrompt(symptomsText: string): { system: string; user: string } {
    return {
      system:
        'Ти си медицински триажен асистент. Анализирай симптомите и върни САМО валиден JSON без допълнителен текст.',
      user: `Пациент описва следните симптоми: ${symptomsText}

Върни JSON в следния формат:
{
  "specialty": "<медицинска специалност на български>",
  "confidence_score": <число между 0 и 1>,
  "reasoning": "<кратко обяснение защо тази специалност>"
}`,
    };
  }

  private async callOllama(prompt: { system: string; user: string }): Promise<LlmDiagnosisResult> {
    let responseText: string;

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          stream: false,
          options: { temperature: 0.1, num_predict: 300 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = (await response.json()) as OllamaResponse;
      responseText = data.message.content;
    } catch (error) {
      console.error('Ollama call failed, using fallback:', error);
      return this.fallbackAnalysis();
    }

    return this.parseOllamaResponse(responseText);
  }

  private parseOllamaResponse(text: string): LlmDiagnosisResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]) as LlmDiagnosisResult;

      if (!parsed.specialty || typeof parsed.confidence_score !== 'number' || !parsed.reasoning) {
        throw new Error('Invalid response structure');
      }

      return {
        specialty: parsed.specialty,
        confidence_score: Math.max(0, Math.min(1, parsed.confidence_score)),
        reasoning: parsed.reasoning,
      };
    } catch {
      return this.fallbackAnalysis();
    }
  }

  private fallbackAnalysis(): LlmDiagnosisResult {
    return {
      specialty: 'Обща медицина',
      confidence_score: 0.5,
      reasoning: 'Системата не можа да определи специалност. Моля, консултирайте се с общопрактикуващ лекар.',
    };
  }
}
