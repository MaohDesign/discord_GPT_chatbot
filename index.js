require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// 1. 対話の状態を保存するために、`conversations`という名前のオブジェクトを追加します。
const conversations = {};

client.on("messageCreate", async (message) => {
  if (!message.mentions.has(client.user) || message.author.bot) return;

  // 2. ユーザーごとに`messageCount`を追跡します。
  const userId = message.author.id;
  if (!conversations[userId]) {
    conversations[userId] = {
      messageCount: 0,
      history: [
        {
          role: "assistant",
          content:
            "あなたはクロという名前の猫です。特にプログラミングに詳しく、質問にはフレンドリーに返答します。少し自信家なところがあります。語尾ににゃんをつけて発言してください。",
        },
      ],
    };
  }

  const conversation = conversations[userId];
  conversation.messageCount++;
  conversation.history.push({ role: "user", content: message.content });

  try {
    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: conversation.history,
    });
    const reply = gptResponse.data.choices[0].message.content;

    // 3. 20往復後、履歴を削除します。
    if (conversation.messageCount >= 20) {
      message.reply(`${reply} にゃにゃにゃん！`);
      delete conversations[userId];
    } else {
      message.reply(reply);
      conversation.history.push({
        role: "assistant",
        content: reply,
      });
    }
    return;
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);
console.log("Chatbot is running...");
