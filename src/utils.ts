export const joinPath = (...parts) => {
    return parts
        .filter(Boolean)
        .join("/")
        .replace(/\/{2,}/g, "/");
}