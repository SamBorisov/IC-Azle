import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a message in the system.
 */
type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

/**
 * Represents the payload for creating a new message.
 */
type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>


/**
 * Represents a story in the system.
 */
type Story = Record<{
    id: string;
    title: string;
    messages: Vec<Message>;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

/**
 * Represents the payload for creating a new story.
 */
type StoryPayload = Record<{
    title: string;
}>

const storyStorage = new StableBTreeMap<string, Story>(0, 44, 1024);


/**
 * Creates a new story with the provided title.
 * @param title The title of the story.
 * @returns Result containing the created story or an error message.
 */
$update;
export function createStory(title: string): Result<Story, string> {
    if (!title || title.trim() === '') {
        return Result.Err('Error: Title is required.');
    }

    if (title.length > 255) {
        return Result.Err('Error: Title is too long (maximum 255 characters).');
    }
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


/**
 * Retrieves all stories.
 * @returns Result containing a vector of stories or an error message.
 */
$query;
export function getStories(): Result<Vec<Story>, string> {
    return Result.Ok(storyStorage.values());
}

/**
 * Retrieves a story by ID.
 * @param id The ID of the story to retrieve.
 * @returns Result containing the story or an error message if not found.
 */
export function getStory(id: string): Result<Story, string> {
    const story = storyStorage.get(id);
    if (story) {
        return Result.Ok(story);
    } else {
        return Result.Err(`Error: A story with id=${id} not found.`);
    }
}

/**
 * Adds a message to a story.
 * @param storyId The ID of the story.
 * @param payload The message payload.
 * @returns Result containing the added message or an error message.
 */
export function addMessageToStory(storyId: string, payload: MessagePayload): Result<Message, string> {
    const existingStory = storyStorage.get(storyId);

    if (!existingStory) {
        return Result.Err(`Error: Couldn't add a message to the story with id=${storyId}. Story not found.`);
    }

    // Validate the message payload.
    if (!payload.title || payload.title.trim() === '') {
        return Result.Err('Error: Message title is required.');
    }

    if (!payload.body || payload.body.trim() === '') {
        return Result.Err('Error: Message body is required.');
    }

    if (!payload.attachmentURL || payload.attachmentURL.trim() === '') {
        return Result.Err('Error: Message attachmentURL is required.');
    }

    const message: Message = {
        id: uuidv4(),
        ...payload,
        createdAt: ic.time(),
        updatedAt: Opt.None,
    };

    existingStory.messages.push(message);
    storyStorage.insert(existingStory.id, existingStory);
    return Result.Ok(message);
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