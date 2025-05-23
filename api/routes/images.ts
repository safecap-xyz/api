import { FastifyInstance } from 'fastify';
import { Client } from "@gradio/client";
import { handleError } from '../utils/error-handler.js';
import { GenerateImageRequest, GenerateImageResponse } from '../types/index.js';

export default async function(app: FastifyInstance) {
  app.post<{ Body: GenerateImageRequest }>('/api/generate-image', async (req, reply) => {
    const {
      refImageUrl1,
      refImageUrl2,
      prompt,
      seed = 42,
      width = 1024,
      height = 1024,
      ref_res = 512,
      num_steps = 30,
      guidance = 7.0,
      true_cfg = 1.0,
      cfg_start_step = 0,
      cfg_end_step = 1.0,
      neg_prompt = '',
      neg_guidance = 1.0,
      first_step_guidance = 7.0,
      ref_task1 = 'style',
      ref_task2 = 'structure'
    } = req.body;

    try {
      console.log('Generating image with:', {
        prompt,
        seed,
        width,
        height
      });

      // Create a client for the Gradio app
      const client = await Client.connect("https://huggingface-projects-photomaker-demo.hf.space/");

      // Make a prediction using the model
      const result = await client.predict("/run", [
        refImageUrl1,              // Reference image 1 URL
        refImageUrl2,              // Reference image 2 URL
        prompt,                    // Prompt
        seed,                      // Seed
        width,                     // Width
        height,                    // Height
        ref_res,                   // Reference image resolution
        num_steps,                 // Number of steps
        guidance,                  // Guidance scale
        true_cfg,                  // True class-free guidance scale
        cfg_start_step,            // Class-free guidance start step
        cfg_end_step,              // Class-free guidance end step
        neg_prompt,                // Negative prompt
        neg_guidance,              // Negative guidance scale
        first_step_guidance,       // First step guidance scale
        ref_task1,                 // Reference task 1
        ref_task2                  // Reference task 2
      ]);

      console.log('Image generation result:', {
        success: true,
        hasData: !!result.data
      });

      const response: GenerateImageResponse = {
        data: result.data,
        success: true,
        metadata: {
          seed,
          width,
          height,
          prompt
        }
      };

      return reply.send(response);
    } catch (error) {
      handleError(error, reply);
    }
  });
}
