import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { RaceAnalysis } from "@/components/analysis/RaceAnalysis";
import { RaceList } from "@/pages/Analysis/components/RaceList";
import { PageHeader } from "@/pages/Analysis/components/PageHeader";

const Analysis = () => {
  const { raceId } = useParams();

  if (raceId) {
    return <RaceAnalysis raceId={raceId} />;
  }

  return (
    <div>
      <PageHeader />
      <RaceList />
    </div>
  );
};

export default Analysis;