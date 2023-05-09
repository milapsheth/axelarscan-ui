export const NUM_BLOCKS_PER_HEARTBEAT = 50

export const endBlock = (
  height,
  numBlocks = NUM_BLOCKS_PER_HEARTBEAT,
  fraction = 1,
) => {
  while (height > 0 && height % numBlocks !== fraction) {
    height--
  }
  return height
}

export const startBlock = height => endBlock(height)