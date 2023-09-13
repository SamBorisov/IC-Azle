import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';


type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>

type Story = Record<{
    id: string;
    title: string;
    messages: Vec<Message>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type StoryPayload = Record<{
    title: string;
}>

const storyStorage = new StableBTreeMap<string, Story>(0, 44, 1024);

$update;
export function createStory(title: string): Result<Story, string> {
    const story: Story = {
        id: uuidv4(),
        title,
        messages: [] as Vec<Message>,
        createdAt: ic.time(),
        updatedAt: Opt.None,
    };
    storyStorage.insert(story.id, story);
    return Result.Ok(story);
}

$query;
export function getStories(): Result<Vec<Story>, string> {
    return Result.Ok(storyStorage.values());
}

$query;
export function getStory(id: string): Result<Story, string> {
    return match(storyStorage.get(id), {
        Some: (story) => Result.Ok<Story, string>(story),
        None: () => Result.Err<Story, string>(`A story with id=${id} not found`)
    });
}

$update;
export function addMessageToStory(storyId: string, payload: MessagePayload): Result<Message, string> {
    return match(storyStorage.get(storyId), {
        Some: (story) => {
            const message: Message = {
                id: uuidv4(),
                ...payload,
                createdAt: ic.time(),
                updatedAt: Opt.None,
            };
            story.messages.push(message);
            storyStorage.insert(story.id, story);
            return Result.Ok<Message, string>(message);
        },
        None: () => Result.Err<Message, string>(`Couldn't add a message to the story with id=${storyId}. Story not found`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};