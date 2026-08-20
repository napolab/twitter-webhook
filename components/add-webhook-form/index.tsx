import { useCallback, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { webhookInputSchema } from "@/shared/webhooks/schema";

import * as styles from "./styles.css";

import type { WebhookInput } from "@/shared/webhooks/schema";
import type { SubmitEvent } from "react";

const URL_ERROR_MESSAGE =
  "discord.com/api/webhooks/ から始まる Discord webhook の URL を入力してください";

type FieldErrors = {
  name?: string;
  url?: string;
};

// zod の regex 違反メッセージは汎用的なため、URL フィールドは discord に言及する
// 固定メッセージへ差し替える。shared/webhooks/schema.ts 自体は変更しない。
const resolveFieldErrors = (error: z.ZodError<WebhookInput>): FieldErrors => {
  const flattened = z.flattenError(error);

  return {
    get name() {
      return flattened.fieldErrors.name?.[0];
    },
    get url() {
      if (!flattened.fieldErrors.url) return undefined;
      return URL_ERROR_MESSAGE;
    },
  };
};

type AddWebhookFormProps = {
  onSubmit: (input: WebhookInput) => Promise<void>;
};

export const AddWebhookForm = ({ onSubmit }: AddWebhookFormProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = useCallback(
    async (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      const result = webhookInputSchema.safeParse({ name, url });
      if (!result.success) {
        setErrors(resolveFieldErrors(result.error));
        return;
      }
      setErrors({});

      try {
        await onSubmit(result.data);
        setName("");
        setUrl("");
      } catch (error) {
        console.error(error);
      }
    },
    [name, url, onSubmit],
  );

  return (
    <form className={styles.root} onSubmit={handleSubmit}>
      <TextField
        label="NAME"
        value={name}
        onChange={setName}
        errorMessage={errors.name}
        isInvalid={errors.name !== undefined}
      />
      <TextField
        label="URL"
        value={url}
        onChange={setUrl}
        errorMessage={errors.url}
        isInvalid={errors.url !== undefined}
      />
      <div className={styles.actions}>
        <Button type="submit">ADD</Button>
      </div>
    </form>
  );
};
