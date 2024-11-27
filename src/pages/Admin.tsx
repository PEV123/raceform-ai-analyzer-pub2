import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RaceData {
  off_time: string;
  course: string;
  race_name: string;
  region: string;
  race_class: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: number;
}

interface RunnerData {
  horse_id: string;
  number: number;
  draw: number;
  horse: string;
  silk_url?: string;
  sire: string;
  sire_region: string;
  dam: string;
  dam_region: string;
  form?: string;
  lbs: number;
  headgear?: string;
  ofr?: string;
  ts?: string;
  jockey: string;
  trainer: string;
}

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [raceData, setRaceData] = useState<RaceData>({
    off_time: "",
    course: "",
    race_name: "",
    region: "",
    race_class: "",
    age_band: "",
    rating_band: "",
    prize: "",
    field_size: 0,
  });

  const [runnerData, setRunnerData] = useState<RunnerData>({
    horse_id: "",
    number: 0,
    draw: 0,
    horse: "",
    sire: "",
    sire_region: "",
    dam: "",
    dam_region: "",
    lbs: 0,
    jockey: "",
    trainer: "",
  });

  const addRaceMutation = useMutation({
    mutationFn: async (data: RaceData) => {
      console.log("Adding race:", data);
      const { data: race, error } = await supabase
        .from("races")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return race;
    },
    onSuccess: () => {
      console.log("Race added successfully");
      toast({
        title: "Success",
        description: "Race has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
      setRaceData({
        off_time: "",
        course: "",
        race_name: "",
        region: "",
        race_class: "",
        age_band: "",
        rating_band: "",
        prize: "",
        field_size: 0,
      });
    },
    onError: (error) => {
      console.error("Error adding race:", error);
      toast({
        title: "Error",
        description: "Failed to add race. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addRunnerMutation = useMutation({
    mutationFn: async (data: RunnerData & { race_id: string }) => {
      console.log("Adding runner:", data);
      const { data: runner, error } = await supabase
        .from("runners")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return runner;
    },
    onSuccess: () => {
      console.log("Runner added successfully");
      toast({
        title: "Success",
        description: "Runner has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["races"] });
      setRunnerData({
        horse_id: "",
        number: 0,
        draw: 0,
        horse: "",
        sire: "",
        sire_region: "",
        dam: "",
        dam_region: "",
        lbs: 0,
        jockey: "",
        trainer: "",
      });
    },
    onError: (error) => {
      console.error("Error adding runner:", error);
      toast({
        title: "Error",
        description: "Failed to add runner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting race data:", raceData);
    addRaceMutation.mutate(raceData);
  };

  const handleRunnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting runner data:", runnerData);
    
    // Get the latest race ID
    const { data: latestRace, error: raceError } = await supabase
      .from("races")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (raceError) {
      console.error("Error fetching latest race:", raceError);
      toast({
        title: "Error",
        description: "Failed to fetch latest race. Please try again.",
        variant: "destructive",
      });
      return;
    }

    addRunnerMutation.mutate({ ...runnerData, race_id: latestRace.id });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Race</h2>
          <form onSubmit={handleRaceSubmit} className="space-y-4">
            <div>
              <Label htmlFor="off_time">Off Time</Label>
              <Input
                id="off_time"
                type="datetime-local"
                value={raceData.off_time}
                onChange={(e) =>
                  setRaceData({ ...raceData, off_time: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={raceData.course}
                onChange={(e) =>
                  setRaceData({ ...raceData, course: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="race_name">Race Name</Label>
              <Input
                id="race_name"
                value={raceData.race_name}
                onChange={(e) =>
                  setRaceData({ ...raceData, race_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={raceData.region}
                onChange={(e) =>
                  setRaceData({ ...raceData, region: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="race_class">Race Class</Label>
              <Input
                id="race_class"
                value={raceData.race_class}
                onChange={(e) =>
                  setRaceData({ ...raceData, race_class: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="age_band">Age Band</Label>
              <Input
                id="age_band"
                value={raceData.age_band}
                onChange={(e) =>
                  setRaceData({ ...raceData, age_band: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="rating_band">Rating Band</Label>
              <Input
                id="rating_band"
                value={raceData.rating_band}
                onChange={(e) =>
                  setRaceData({ ...raceData, rating_band: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="prize">Prize</Label>
              <Input
                id="prize"
                value={raceData.prize}
                onChange={(e) =>
                  setRaceData({ ...raceData, prize: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="field_size">Field Size</Label>
              <Input
                id="field_size"
                type="number"
                value={raceData.field_size}
                onChange={(e) =>
                  setRaceData({
                    ...raceData,
                    field_size: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
            <Button type="submit" disabled={addRaceMutation.isPending}>
              {addRaceMutation.isPending ? "Adding..." : "Add Race"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Runner</h2>
          <form onSubmit={handleRunnerSubmit} className="space-y-4">
            <div>
              <Label htmlFor="horse_id">Horse ID</Label>
              <Input
                id="horse_id"
                value={runnerData.horse_id}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, horse_id: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                type="number"
                value={runnerData.number}
                onChange={(e) =>
                  setRunnerData({
                    ...runnerData,
                    number: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="draw">Draw</Label>
              <Input
                id="draw"
                type="number"
                value={runnerData.draw}
                onChange={(e) =>
                  setRunnerData({
                    ...runnerData,
                    draw: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="horse">Horse Name</Label>
              <Input
                id="horse"
                value={runnerData.horse}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, horse: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="silk_url">Silk URL</Label>
              <Input
                id="silk_url"
                value={runnerData.silk_url}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, silk_url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="sire">Sire</Label>
              <Input
                id="sire"
                value={runnerData.sire}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, sire: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="sire_region">Sire Region</Label>
              <Input
                id="sire_region"
                value={runnerData.sire_region}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, sire_region: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dam">Dam</Label>
              <Input
                id="dam"
                value={runnerData.dam}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, dam: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dam_region">Dam Region</Label>
              <Input
                id="dam_region"
                value={runnerData.dam_region}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, dam_region: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="form">Form</Label>
              <Input
                id="form"
                value={runnerData.form}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, form: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="lbs">Weight (lbs)</Label>
              <Input
                id="lbs"
                type="number"
                value={runnerData.lbs}
                onChange={(e) =>
                  setRunnerData({
                    ...runnerData,
                    lbs: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="headgear">Headgear</Label>
              <Input
                id="headgear"
                value={runnerData.headgear}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, headgear: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="ofr">OFR</Label>
              <Input
                id="ofr"
                value={runnerData.ofr}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, ofr: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="ts">TS</Label>
              <Input
                id="ts"
                value={runnerData.ts}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, ts: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="jockey">Jockey</Label>
              <Input
                id="jockey"
                value={runnerData.jockey}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, jockey: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="trainer">Trainer</Label>
              <Input
                id="trainer"
                value={runnerData.trainer}
                onChange={(e) =>
                  setRunnerData({ ...runnerData, trainer: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" disabled={addRunnerMutation.isPending}>
              {addRunnerMutation.isPending ? "Adding..." : "Add Runner"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Admin;