import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const MTGCB_API_BASE_URL = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';

interface SetData {
  setName: string;
  username: string;
  totalCards: number;
  collected: number;
  percentageCollected: number;
  totalValue: number;
  totalCardsCollected: number;
  setCode?: string;
  releaseDate?: string;
  isPrivate?: boolean;
}

async function fetchSetData(
  userId: string,
  setSlug: string,
  shareToken?: string
): Promise<SetData | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (shareToken) {
      headers['X-Share-Token'] = shareToken;
    }

    const apiUrl = `${MTGCB_API_BASE_URL}/sets/search`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: parseInt(userId),
        slug: setSlug,
        limit: 1,
        priceType: 'market',
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData?.error?.code === 'COLLECTION_PRIVATE') {
          return {
            setName: 'Set',
            username: 'User',
            totalCards: 0,
            collected: 0,
            percentageCollected: 0,
            totalValue: 0,
            totalCardsCollected: 0,
            isPrivate: true,
          };
        }
      }
      return null;
    }

    const data = await response.json();
    
    if (data?.success && data?.data?.sets?.length > 0) {
      const set = data.data.sets[0];
      return {
        setName: set.name || 'Unknown Set',
        username: data.data.username || 'User',
        totalCards: set.cardCount || 0,
        collected: set.uniquePrintingsCollectedInSet || 0,
        percentageCollected: set.percentageCollected || 0,
        totalValue: set.totalValue || 0,
        totalCardsCollected: set.totalCardsCollectedInSet || 0,
        setCode: set.code,
        releaseDate: set.releasedAt,
        isPrivate: false,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const setSlug = searchParams.get('setSlug');
    const shareToken = searchParams.get('shareToken');
    
    if (!userId || !setSlug) {
      return new Response('Missing userId or setSlug', { status: 400 });
    }

    const setData = await fetchSetData(userId, setSlug, shareToken || undefined);
    
    // Default values
    const isPrivate = setData?.isPrivate ?? false;
    const setName = setData?.setName || 'Set';
    const username = setData?.username || 'User';
    const collected = setData?.collected || 0;
    const totalCards = setData?.totalCards || 1;
    const percentageCollected = setData?.percentageCollected || 0;
    const totalValue = setData?.totalValue || 0;
    const totalCardsCollected = setData?.totalCardsCollected || 0;
    const setCode = setData?.setCode || '';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #050a30 0%, #2e0845 100%)',
            padding: 60,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Subtle gradient overlay at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3))',
              pointerEvents: 'none',
            }}
          />
          
          {isPrivate ? (
            // Private Collection View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 30,
                position: 'relative',
              }}
            >
              {/* Logo and Title */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 72,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    Private Collection
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    on MTG Collection Builder
                  </div>
                </div>
              </div>
              
              {/* Private message */}
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 20,
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginBottom: 30 }}
                  >
                    <path
                      d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V19a1 1 0 11-2 0v-1.277a2 2 0 112 0z"
                      fill="#666666"
                    />
                  </svg>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    This collection is not publicly visible
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Public Set View
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 25,
                position: 'relative',
              }}
            >
              {/* Title Section with Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 30,
                }}
              >
                <img
                  src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
                  alt="MTG Collection Builder"
                  width={130}
                  height={130}
                  style={{
                    objectFit: 'contain',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 60,
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {setName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 32,
                      color: '#999999',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    in {username}'s Collection on MTG Collection Builder
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  marginTop: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 30,
                    color: '#999999',
                  }}
                >
                  Set Completion
                </div>
                
                {/* Progress Bar */}
                <div
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    height: 60,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 30,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${Math.min(percentageCollected, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 20,
                    }}
                  >
                    {percentageCollected > 5 && (
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 30,
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      >
                        {percentageCollected.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {percentageCollected <= 5 && (
                    <div
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 30,
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {percentageCollected.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  marginTop: 15,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 15,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 60,
                        fontWeight: 700,
                        color: '#1976d2',
                      }}
                    >
                      {collected}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 40,
                        color: '#666666',
                      }}
                    >
                      /
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 60,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {totalCards}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 36,
                      color: '#999999',
                    }}
                  >
                    unique cards collected
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 44,
                      fontWeight: 600,
                      color: '#1976d2',
                    }}
                  >
                    {totalCardsCollected}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 30,
                      color: '#999999',
                    }}
                  >
                    total cards in set collection
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response('Failed to generate image', { status: 500 });
  }
}