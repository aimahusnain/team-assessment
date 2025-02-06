"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, Settings } from "lucide-react";

const Inputs = () => {
  const [config, setConfig] = React.useState({
    totalCallMinThreshold: 750,
    teamMemberThreshold: 4,
    weights: {
      tcm: 15,
      ce: 15,
      ts: 40,
      rbsl: 30,
    },
  });

  const handleInputChange = (field: string, value: number) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeightChange = (
    field: keyof typeof config.weights,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [field]: value,
      },
    }));
  };

  const validateWeights = () => {
    const total = Object.values(config.weights).reduce((a, b) => a + b, 0);
    return total === 100;
  };

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2">
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
          <CardHeader className="">
            <div className="flex items-center space-x-4">
              <Settings className="h-6 w-6 text-primary" />
              <CardTitle>System Configuration</CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6 p-6">
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
              <h3 className="text-lg font-semibold">Weightage Configuration</h3>
              {Object.entries(config.weights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="capitalize">{key} Weight</Label>
                    <span className="text-muted-foreground">{value}%</span>
                  </div>
                  <Slider
                    defaultValue={[value]}
                    max={100}
                    step={1}
                    onValueChange={(vals) =>
                      handleWeightChange(
                        key as keyof typeof config.weights,
                        vals[0]
                      )
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
              <Button variant="outline">Reset</Button>
              <Button disabled={!validateWeights()} className="dark:text-black">Save Configuration</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inputs;
