"use client";

import React, { useEffect, useState } from "react";
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
import { Settings } from "lucide-react";
import { Toaster, toast } from "sonner";

type Config = {
  id: string;
  totalCallMinThreshold: number;
  teamMemberThreshold: number;
  weights: { tcm: number; ce: number; ts: number; rbsl: number };
};

const Inputs = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/get-inputs");
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          const inputData = data.data[0];
          setConfig({
            id: inputData.id,
            totalCallMinThreshold: Number(inputData.call_mins_thr),
            teamMemberThreshold: Number(inputData.team_members_thr),
            weights: {
              tcm: Number(inputData.score_tcm_weightage),
              ce: Number(inputData.score_ce_weightage),
              ts: Number(inputData.score_ts_weightage),
              rbsl: Number(inputData.score_rbsl_weightage),
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch inputs", error);
        toast.error("Failed to load configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input changes
  const handleInputChange = (
    field: keyof Omit<Config, "id" | "weights">,
    value: number
  ) => {
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
        weights: { ...config.weights, [field]: value },
      });
    }
  };

  // Validate that total weights sum to 100
  const validateWeights = (): boolean => {
    if (!config) return false;
    const total = Object.values(config.weights).reduce((a, b) => a + b, 0);
    return total === 100;
  };

  // Save configuration to API
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
          weights: config.weights,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Configuration saved!");
      } else {
        toast.error("Failed to update configuration.");
        console.error("Failed to update config", data.message);
      }
    } catch (error) {
      toast.error("Error updating configuration.");
      console.error("Error updating config", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Toaster component from Sonner */}
      <Toaster position="top-right" />

      <header className="flex h-16 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Activity Log</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex items-center justify-center">
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle>System Configuration</CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 p-6">
            {loading ? (
              // Skeleton loading state
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-6 w-1/2 rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ) : config ? (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Total Call Min Threshold</Label>
                    <Input
                      type="number"
                      value={config.totalCallMinThreshold}
                      onChange={(e) =>
                        handleInputChange(
                          "totalCallMinThreshold",
                          Number(e.target.value)
                        )
                      }
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Team Members Threshold</Label>
                    <Input
                      type="number"
                      value={config.teamMemberThreshold}
                      onChange={(e) =>
                        handleInputChange(
                          "teamMemberThreshold",
                          Number(e.target.value)
                        )
                      }
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Weightage Configuration
                  </h3>
                  {(
                    Object.entries(config.weights) as [
                      keyof Config["weights"],
                      number
                    ][]
                  ).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="capitalize"><span className="uppercase">{key}</span> Weight</Label>
                        <span className="text-muted-foreground">{value}%</span>
                      </div>
                      <Slider
                        defaultValue={[value]}
                        max={100}
                        step={1}
                        onValueChange={(vals) =>
                          handleWeightChange(key, vals[0])
                        }
                      />
                    </div>
                  ))}
                  {!validateWeights() && (
                    <p className="text-destructive text-sm">
                      Total weights must sum to 100%
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // For reset, you might consider refetching or storing initial config
                      window.location.reload();
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    disabled={!validateWeights() || saving}
                    onClick={saveConfig}
                    className="dark:text-black"
                  >
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center text-destructive">
                Failed to load configuration.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inputs;
