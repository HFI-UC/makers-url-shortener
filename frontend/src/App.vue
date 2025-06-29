<script setup lang="ts">
import { Form, type FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import { ref } from "vue";
import { z } from "zod";
import { postUrl } from "./api";
import { useToast } from "primevue";
const initialValues = {
  url: "",
};
const resolver = ref(
  zodResolver(
    z.object({
      url: z.string().url(),
    })
  )
);
const submitLoading = ref(false);
const result = ref<Record<string, string>[]>([]);
const toast = useToast();
const onSubmitEvent = async (form: FormSubmitEvent) => {
  if (!form.valid) {
    return;
  }
  submitLoading.value = true;
  const response = await postUrl(form.values.url);
  console.log(response)
  if (response.status !== 200) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: response.error,
      life: 3000,
    });
    submitLoading.value = false;
    return;
  }
  result.value.push({ [response.key]: form.values.url });
  submitLoading.value = false;
  form.reset();
};
const copy = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.add({
    severity: "success",
    summary: "Link copied to clipboard.",
    life: 3000,
  });
};
</script>

<template>
  <Toast></Toast>
  <div class="md:my-[5rem] m-6 md:mx-[3rem]">
    <h1 class="md:text-3xl text-2xl font-bold my-4">MAKERs' URL Shortener</h1>
    <Form :initialValues :resolver @submit="onSubmitEvent" v-slot="$form">
      <div class="flex flex-col gap-2 md:w-[23rem]">
        <InputText
          placeholder="https://example.com"
          name="url"
          type="text"
        ></InputText>
        <Message v-if="$form.url?.invalid" severity="error" size="small">{{
          $form.url.error?.message
        }}</Message>
        <Button
          type="submit"
          label="Submit"
          icon="pi pi-check"
          :disabled="submitLoading"
          :loading="submitLoading"
        ></Button>
      </div>
    </Form>
    <p class="mt-4 font-bold" v-if="result.length">Shortened URLs:</p>
    <ul class="list-disc list-inside md:w-[30rem]">
      <li v-for="(item, index) in result" :key="index" class="truncate">
        <span v-for="(_, shortKey) in item" :key="shortKey">
          <a
            :href="`https://r.utility.center${shortKey}`"
            target="_blank"
            class="text-blue-600 underline"
            >{{ `https://r.utility.center${shortKey}` }}</a
          >
          <a
            class="ml-2 text-xs text-green-600 active:text-green-700 underline"
            @click="copy(`https://r.utility.center${shortKey}`)"
            href="#"
            >Copy</a
          >
        </span>
      </li>
    </ul>
  </div>
</template>
