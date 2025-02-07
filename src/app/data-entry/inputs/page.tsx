"use client";

import { useEffect, useState } from "react";
import { Settings, Save, RotateCcw } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Toaster, toast } from "sonner";
import { ScoreMatrixTable } from "@/components/score-matrix-table";

// Types remain the same but ensure string types for certain fields
type Config = {
  id: string;
  totalCallMinThreshold: number;
  teamMemberThreshold: string; // Changed to string
  weights: { tcm: string; ce: string; ts: string; rbsl: string }; // Changed to string
  individual_score_tcm_benchmark: number;
  individual_score_tcm_interval: number;
  individual_score_ce_benchmark: string; // Changed to string
  individual_score_ce_interval: string; // Changed to string
  individual_score_ts_benchmark: number;
  individual_score_ts_interval: number;
  individual_score_rbsl_benchmark: string; // Changed to string
  individual_score_rbsl_interval: string; // Changed to string
  team_score_tcm_benchmark: number;
  team_score_tcm_interval: number;
  team_score_ce_benchmark: string; // Changed to string
  team_score_ce_interval: string; // Changed to string
  team_score_ts_benchmark: number;
  team_score_ts_interval: number;
  team_score_rbsl_benchmark: string; // Changed to string
  team_score_rbsl_interval: string; // Changed to string
};

type ThresholdField = "totalCallMinThreshold" | "teamMemberThreshold";

const formatNumber = (value: number | string) => {
  const num = Number(value);
  return !isNaN(num) ? num.toLocaleString() : value;
};

// Create a type for the data prop that allows dynamic string keys
type ScoreTableData = {
  [key: string]: string | number;
};

const ScoreTable = ({
  data,
  title,
  onUpdate,
}: {
  data: ScoreTableData;
  title: string;
  onUpdate?: (field: string, value: string | number) => void;
}) => (
  <Card className="shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-semibold text-primary">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead>Benchmark</TableHead>
              <TableHead>Interval</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(["tcm", "ce", "ts", "rbsl"] as const).map((score) => (
              <TableRow key={score}>
                <TableCell className="font-medium uppercase">{score}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={data[`${score}_benchmark`]}
                      onChange={(e) =>
                        onUpdate?.(`${score}_benchmark`, e.target.value)
                      }
                      className="w-32"
                    />
                    {score === "ce" || score === "rbsl" ? <span>%</span> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={data[`${score}_interval`]}
                      onChange={(e) =>
                        onUpdate?.(`${score}_interval`, e.target.value)
                      }
                      className="w-32"
                    />
                    {score === "ce" || score === "rbsl" ? <span>%</span> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

export default function Inputs() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/get-inputs");
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        const inputData = data.data[0];
        setConfig({
          id: inputData.id,
          totalCallMinThreshold: Number(inputData.call_mins_thr),
          teamMemberThreshold: String(inputData.team_members_thr),
          weights: {
            tcm: String(inputData.score_tcm_weightage),
            ce: String(inputData.score_ce_weightage),
            ts: String(inputData.score_ts_weightage),
            rbsl: String(inputData.score_rbsl_weightage),
          },
          individual_score_tcm_benchmark: Number(
            inputData.individual_score_tcm_benchmark
          ),
          individual_score_tcm_interval: Number(
            inputData.individual_score_tcm_interval
          ),
          individual_score_ce_benchmark: String(
            inputData.individual_score_ce_benchmark
          ),
          individual_score_ce_interval: String(
            inputData.individual_score_ce_interval
          ),
          individual_score_ts_benchmark: Number(
            inputData.individual_score_ts_benchmark
          ),
          individual_score_ts_interval: Number(
            inputData.individual_score_ts_interval
          ),
          individual_score_rbsl_benchmark: String(
            inputData.individual_score_rbsl_benchmark
          ),
          individual_score_rbsl_interval: String(
            inputData.individual_score_rbsl_interval
          ),
          team_score_tcm_benchmark: Number(inputData.team_score_tcm_benchmark),
          team_score_tcm_interval: Number(inputData.team_score_tcm_interval),
          team_score_ce_benchmark: String(inputData.team_score_ce_benchmark),
          team_score_ce_interval: String(inputData.team_score_ce_interval),
          team_score_ts_benchmark: Number(inputData.team_score_ts_benchmark),
          team_score_ts_interval: Number(inputData.team_score_ts_interval),
          team_score_rbsl_benchmark: String(
            inputData.team_score_rbsl_benchmark
          ),
          team_score_rbsl_interval: String(inputData.team_score_rbsl_interval),
        } as Config);
      }
    } catch (error) {
      console.error("Failed to fetch inputs", error);
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: ThresholdField, value: number | string) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  const handleWeightChange = (
    field: keyof Config["weights"],
    value: number
  ) => {
    if (config) {
      setConfig({
        ...config,
        weights: { ...config.weights, [field]: String(value) },
      });
    }
  };

  const handleScoreUpdate = (
    type: "individual" | "team",
    field: string,
    value: string | number
  ) => {
    if (config) {
      setConfig({
        ...config,
        [`${type}_score_${field}`]: value,
      });
    }
  };

  const totalWeight = config
    ? Object.values(config.weights).reduce((a, b) => a + Number(b), 0)
    : 0;

  const validateWeights = () => totalWeight === 100;

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const res = await fetch("/api/update-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: config.id,
          call_mins_thr: config.totalCallMinThreshold,
          team_members_thr: config.teamMemberThreshold,
          score_tcm_weightage: config.weights.tcm,
          score_ce_weightage: config.weights.ce,
          score_ts_weightage: config.weights.ts,
          score_rbsl_weightage: config.weights.rbsl,
          // Individual scores
          individual_score_tcm_benchmark: config.individual_score_tcm_benchmark,
          individual_score_tcm_interval: config.individual_score_tcm_interval,
          individual_score_ce_benchmark: config.individual_score_ce_benchmark,
          individual_score_ce_interval: config.individual_score_ce_interval,
          individual_score_ts_benchmark: config.individual_score_ts_benchmark,
          individual_score_ts_interval: config.individual_score_ts_interval,
          individual_score_rbsl_benchmark:
            config.individual_score_rbsl_benchmark,
          individual_score_rbsl_interval: config.individual_score_rbsl_interval,
          // Team scores
          team_score_tcm_benchmark: config.team_score_tcm_benchmark,
          team_score_tcm_interval: config.team_score_tcm_interval,
          team_score_ce_benchmark: config.team_score_ce_benchmark,
          team_score_ce_interval: config.team_score_ce_interval,
          team_score_ts_benchmark: config.team_score_ts_benchmark,
          team_score_ts_interval: config.team_score_ts_interval,
          team_score_rbsl_benchmark: config.team_score_rbsl_benchmark,
          team_score_rbsl_interval: config.team_score_rbsl_interval,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Configuration saved successfully!");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      <header className="sticky top-0 z-50 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Data Entry</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>System Configuration</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 dark:text-white">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">System Configuration</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="dark:text-white"
                onClick={() => window.location.reload()}
                disabled={loading || saving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={saveConfig}
                className="dark:text-black"
                disabled={!validateWeights() || saving || loading}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-[200px] w-full" />
              ))}
              <div className="grid md:grid-cols-2 gap-6">
                <Skeleton key={3} className="h-[300px] w-full" />
                <Skeleton key={4} className="h-[300px] w-full" />
              </div>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-[530px] w-full" />
              ))}
            </div>
          ) : config ? (
            <div className="grid gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-primary">
                    Threshold Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="callMin">
                        Total Call Minutes Threshold
                      </Label>
                      <Input
                        id="callMin"
                        type="number"
                        value={config.totalCallMinThreshold}
                        onChange={(e) =>
                          handleInputChange(
                            "totalCallMinThreshold",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamMembers">
                        Team Members Threshold
                      </Label>
                      <Input
                        id="teamMembers"
                        type="text"
                        value={config.teamMemberThreshold}
                        onChange={(e) =>
                          handleInputChange(
                            "teamMemberThreshold",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-primary">
                    Weight Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Weight</span>
                      <div className="flex items-center gap-2">
                        <Progress value={totalWeight} className="w-32" />
                        <span
                          className={`text-sm font-bold ${
                            validateWeights()
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {totalWeight}%
                        </span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(config.weights).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="capitalize">{key} Weight</Label>
                            <span className="text-sm font-medium">
                              {formatNumber(value)}%
                            </span>
                          </div>
                          <Slider
                            value={[Number(value)]}
                            max={100}
                            step={1}
                            onValueChange={(vals) =>
                              handleWeightChange(
                                key as keyof Config["weights"],
                                vals[0]
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <ScoreTable
                  title="Individual Scores"
                  data={
                    Object.fromEntries(
                      Object.entries(config)
                        .filter(([key]) => key.startsWith("individual_score_"))
                        .map(([key, value]) => [
                          key.replace("individual_score_", ""),
                          // Only include string or number values
                          typeof value === "object" ? "" : value,
                        ])
                    ) as ScoreTableData
                  }
                  onUpdate={(field, value) =>
                    handleScoreUpdate("individual", field, value)
                  }
                />
                <ScoreTable
                  title="Team / Department / Company Scores"
                  data={
                    Object.fromEntries(
                      Object.entries(config)
                        .filter(([key]) => key.startsWith("team_score_"))
                        .map(([key, value]) => [
                          key.replace("team_score_", ""),
                          // Only include string or number values
                          typeof value === "object" ? "" : value,
                        ])
                    ) as ScoreTableData
                  }
                  onUpdate={(field, value) =>
                    handleScoreUpdate("team", field, value)
                  }
                />
              </div>

              <div className="grid gap-6">
                <ScoreMatrixTable
                  title="Individual Score Matrix"
                  benchmark={{
                    tcm: config.individual_score_tcm_benchmark,
                    ce: config.individual_score_ce_benchmark,
                    ts: config.individual_score_ts_benchmark,
                    rbsl: config.individual_score_rbsl_benchmark,
                  }}
                  interval={{
                    tcm: config.individual_score_tcm_interval,
                    ce: config.individual_score_ce_interval,
                    ts: config.individual_score_ts_interval,
                    rbsl: config.individual_score_rbsl_interval,
                  }}
                />
                <ScoreMatrixTable
                  title="Team / Department / Company Score Matrix"
                  benchmark={{
                    tcm: config.team_score_tcm_benchmark,
                    ce: config.team_score_ce_benchmark,
                    ts: config.team_score_ts_benchmark,
                    rbsl: config.team_score_rbsl_benchmark,
                  }}
                  interval={{
                    tcm: config.team_score_tcm_interval,
                    ce: config.team_score_ce_interval,
                    ts: config.team_score_ts_interval,
                    rbsl: config.team_score_rbsl_interval,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-destructive">
              Failed to load configuration
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
