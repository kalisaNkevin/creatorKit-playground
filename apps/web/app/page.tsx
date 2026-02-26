"use client";

import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Badge,
  Code,
  Stack,
} from "@chakra-ui/react";

const steps = [
  {
    icon: "🎵",
    label: "Extract Audio",
    tool: "ffmpeg",
    detail: "Pulls 16 kHz mono MP3 from your local video",
    color: "blue.500",
  },
  {
    icon: "📝",
    label: "Transcribe",
    tool: "OpenAI Whisper",
    detail: "Converts speech to timestamped segments",
    color: "purple.500",
  },
  {
    icon: "🤖",
    label: "Select Clips",
    tool: "Vercel AI SDK",
    detail: "generateObject() picks the 5 best moments",
    color: "green.500",
  },
  {
    icon: "✂",
    label: "Cut Video",
    tool: "ffmpeg",
    detail: "H.264 MP4 clips, web-ready with faststart",
    color: "orange.500",
  },
];

const exampleClips = [
  {
    score: 9,
    category: "prediction",
    title: "AGI Before 2030",
    duration: "1:22",
    hook: "We are going to have AGI, and it's going to be sooner than people think.",
  },
  {
    score: 9,
    category: "controversial",
    title: "Why OpenAI Had to Remove Sam Altman",
    duration: "1:18",
    hook: "The board thought they were doing the right thing. They were wrong.",
  },
  {
    score: 8,
    category: "insight",
    title: "The Real Reason GPT-4 Feels Dumber",
    duration: "1:05",
    hook: "It's not that the model got worse. It's that your expectations got higher.",
  },
  {
    score: 8,
    category: "actionable",
    title: "How to Prompt Better Than 99% of People",
    duration: "0:58",
    hook: "Most people treat AI like a search engine. That's the mistake.",
  },
  {
    score: 7,
    category: "story",
    title: "The Night Microsoft Almost Bought OpenAI",
    duration: "1:31",
    hook: "There was a 48-hour window where everything almost went a different way.",
  },
];

const categoryColors: Record<string, string> = {
  prediction: "purple",
  controversial: "red",
  insight: "blue",
  actionable: "green",
  story: "orange",
  funny: "yellow",
};

export default function Home() {
  return (
    <Box minH="100vh"  maxW="4xl" mx="auto" bg="gray.950" color="white" py="16" px="12">
      <Container maxW="4xl">
        {/* Header */}
        <Stack gap="4" mb="16" textAlign="center">
          <Text fontSize="sm" color="gray.500" letterSpacing="wider" textTransform="uppercase">
            CreatorKit Playground
          </Text>
          <Heading size="4xl" fontWeight="800" letterSpacing="tight">
            Podcast Clip Generator
          </Heading>
          <Text fontSize="lg" color="gray.400" maxW="2xl" mx="auto">
            Pick a podcast. Get 5 viral-ready clips. Fully automated — download,
            transcribe, AI-select, and cut.
          </Text>
          <Flex justify="center" gap="2" flexWrap="wrap">
            <Badge colorScheme="blue" px="3" py="1">yt-dlp</Badge>
            <Badge colorScheme="purple" px="3" py="1">OpenAI Whisper</Badge>
            <Badge colorScheme="green" px="3" py="1">Vercel AI SDK</Badge>
            <Badge colorScheme="orange" px="3" py="1">ffmpeg</Badge>
          </Flex>
        </Stack>

        {/* Podcast */}
        <Box
          bg="gray.900"
          border="1px solid"
          borderColor="gray.700"
          borderRadius="xl"
          p="6"
          mb="12"
        >
          <Flex align="center" gap="4">
            <Box fontSize="4xl">🎙</Box>
            <Box>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb="1">
                Favorite Podcast
              </Text>
              <Text fontWeight="700" fontSize="lg">
                Lex Fridman #431 — Sam Altman
              </Text>
              <Text color="gray.400" fontSize="sm">
                OpenAI, GPT-5, Grok, Llama, Gemini & the Future of AI · ~3 hours
              </Text>
            </Box>
          </Flex>
        </Box>

        <Box mb="12">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb="6">
            Pipeline
          </Text>
          <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap="4">
            {steps.map((step, i) => (
              <Box
                key={step.label}
                bg="gray.900"
                border="1px solid"
                borderColor="gray.800"
                borderRadius="lg"
                p="5"
              >
                <Text fontSize="2xl" mb="3">{step.icon}</Text>
                <Flex align="center" gap="2" mb="1">
                  <Text fontSize="xs" color="gray.600" fontWeight="600">
                    {i + 1}
                  </Text>
                  <Text fontWeight="700" fontSize="sm">{step.label}</Text>
                </Flex>
                <Code fontSize="xs" colorScheme="gray" mb="2" px="2" py="0.5">
                  {step.tool}
                </Code>
                <Text fontSize="xs" color="gray.500">{step.detail}</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        <Box mb="12">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb="6">
            Example Output — Top 5 Clips
          </Text>
          <Stack gap="3">
            {exampleClips.map((clip, i) => (
              <Box
                key={clip.title}
                bg="gray.900"
                border="1px solid"
                borderColor="gray.800"
                borderRadius="lg"
                p="5"
              >
                <Flex justify="space-between" align="flex-start" mb="2">
                  <Flex align="center" gap="3">
                    <Text fontSize="sm" fontWeight="800" color="gray.600">
                      #{i + 1}
                    </Text>
                    <Text fontWeight="700">{clip.title}</Text>
                  </Flex>
                  <Flex gap="2" align="center" flexShrink={0}>
                    <Badge colorScheme={categoryColors[clip.category] ?? "gray"} fontSize="xs">
                      {clip.category}
                    </Badge>
                    <Text fontSize="xs" color="gray.500">{clip.duration}</Text>
                    <Text fontSize="sm">🔥 {clip.score}/10</Text>
                  </Flex>
                </Flex>
                <Text fontSize="sm" color="gray.400" fontStyle="italic">
                  &ldquo;{clip.hook}&rdquo;
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          bg="gray.900"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="xl"
          p="6"
          fontFamily="mono"
        >
          <Text fontSize="xs" color="gray.500" mb="4">Run it</Text>
          <Stack gap="2">
            <Text fontSize="sm" color="gray.300">
              <Text as="span" color="gray.600"># install deps</Text>
            </Text>
            <Text fontSize="sm" color="green.400">brew install yt-dlp ffmpeg</Text>
            <Text fontSize="sm" color="green.400">cd apps/clip-generator && bun install</Text>
            <Text fontSize="sm" color="gray.300" mt="2">
              <Text as="span" color="gray.600"># set your API key and run</Text>
            </Text>
            <Text fontSize="sm" color="green.400">OPENAI_API_KEY=sk-... bun run start</Text>
            <Text fontSize="sm" color="gray.600" mt="2">
              # or pass any YouTube URL as an argument
            </Text>
            <Text fontSize="sm" color="green.400">bun run start https://youtube.com/watch?v=...</Text>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
