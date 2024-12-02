import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const processRaceDocuments = async (race: any, supabaseUrl: string) => {
  if (!race.race_documents?.length) return [];
  
  console.log('Processing race documents:', {
    count: race.race_documents.length,
    documents: race.race_documents.map(doc => ({
      name: doc.file_name,
      type: doc.content_type,
      path: doc.file_path
    }))
  });
  
  const processedDocuments = [];
  
  for (const doc of race.race_documents) {
    try {
      const documentUrl = `${supabaseUrl}/storage/v1/object/public/race_documents/${doc.file_path}`;
      console.log('Processing document:', {
        fileName: doc.file_name,
        contentType: doc.content_type,
        url: documentUrl
      });
      
      const response = await fetch(documentUrl);
      if (!response.ok) {
        console.error(`Failed to fetch document ${doc.file_name}:`, response.statusText);
        continue;
      }

      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      const base64Content = base64Data.split(',')[1];
      
      processedDocuments.push({
        type: doc.content_type.startsWith('image/') ? 'image' : 'document',
        source: {
          type: "base64",
          media_type: doc.content_type,
          data: base64Content
        }
      });
      
      console.log(`Successfully processed document ${doc.file_name}:`, {
        contentType: doc.content_type,
        type: doc.content_type.startsWith('image/') ? 'image' : 'document',
        dataLength: base64Content.length
      });
    } catch (error) {
      console.error(`Error processing document ${doc.file_name}:`, error);
    }
  }
  
  console.log('Successfully processed documents:', {
    count: processedDocuments.length,
    types: processedDocuments.map(doc => doc.type)
  });
  
  return processedDocuments;
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const formatRaceContext = async (race: any) => {
  if (!race) return "No race data available";

  try {
    // Create a structured context object
    const raceContext = {
      race_overview: {
        name: race.race_name,
        course: race.course,
        datetime: race.off_time,
        distance: race.distance,
        going: race.going,
        class: race.race_class,
        prize: race.prize,
        surface: race.surface,
        jumps: race.jumps,
        field_size: race.field_size
      },
      runners: race.runners?.map((runner: any) => ({
        // Basic info
        horse: runner.horse,
        horse_id: runner.horse_id,
        number: runner.number,
        draw: runner.draw,
        weight_lbs: runner.lbs,
        
        // Breeding info
        age: runner.age,
        sex: runner.sex,
        sire: runner.sire,
        sire_region: runner.sire_region,
        dam: runner.dam,
        dam_region: runner.dam_region,
        damsire: runner.damsire,
        
        // Connections
        jockey: runner.jockey,
        trainer: runner.trainer,
        trainer_location: runner.trainer_location,
        owner: runner.owner,
        
        // Form and ratings
        official_rating: runner.ofr,
        rpr: runner.rpr,
        form: runner.form,
        spotlight: runner.spotlight,
        comment: runner.comment,
        
        // Equipment and medical
        headgear: runner.headgear,
        wind_surgery: runner.wind_surgery,
        
        // Statistics
        trainer_14_day_stats: runner.trainer_14_days,
        trainer_rtf: runner.trainer_rtf,
        
        // Non-runner status
        is_non_runner: runner.is_non_runner || false
      })) || [],
      documents: race.race_documents?.map((doc: any) => ({
        name: doc.file_name,
        type: doc.content_type,
        created_at: doc.created_at
      })) || []
    };

    console.log('Generated race context with:', {
      runnerCount: raceContext.runners.length,
      documentCount: raceContext.documents.length
    });
    
    return JSON.stringify(raceContext, null, 2);
  } catch (error) {
    console.error('Error formatting race context:', error);
    return JSON.stringify({ error: 'Failed to format race context' });
  }
};

export { corsHeaders };
