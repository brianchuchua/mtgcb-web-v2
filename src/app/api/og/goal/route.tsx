import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const MTGCB_API_BASE_URL = process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL || '';

interface GoalData {
  goalName: string;
  goalDescription: string | null;
  username: string;
  totalCards: number;
  collectedCards: number;
  percentageCollected: number;
  totalValue: number;
  costToComplete: number;
  isPrivate?: boolean;
}

async function fetchGoalData(userId: string, goalId: string, shareToken?: string): Promise<GoalData | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shareToken) {
      headers['X-Share-Token'] = shareToken;
    }

    // Fetch cards data with goalId to get the goalSummary
    const apiUrl = `${MTGCB_API_BASE_URL}/cards/search`;

    const requestBody = {
      userId: parseInt(userId),
      goalId: parseInt(goalId),
      showGoalProgress: true,
      limit: 1,
      offset: 0,
      priceType: 'market',
    };


    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData?.error?.code === 'COLLECTION_PRIVATE') {
          return {
            goalName: 'Goal',
            goalDescription: null,
            username: 'User',
            totalCards: 0,
            collectedCards: 0,
            percentageCollected: 0,
            totalValue: 0,
            costToComplete: 0,
            isPrivate: true,
          };
        }
      }
      return null;
    }

    const data = await response.json();

    if (data?.success && data?.data) {
      const goalSummary = data.data.goalSummary;
      const username = data.data.username || 'User';


      if (goalSummary) {
        const result = {
          goalName: goalSummary.goalName || 'Unknown Goal',
          goalDescription: null, // Description not available in goalSummary
          username,
          totalCards: goalSummary.totalCards || 0,
          collectedCards: goalSummary.collectedCards || 0,
          percentageCollected: goalSummary.percentageCollected || 0,
          totalValue: goalSummary.totalValue || 0,
          costToComplete: goalSummary.costToComplete || 0,
          isPrivate: false,
        };
        return result;
      }
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
    const goalId = searchParams.get('goalId');
    const shareToken = searchParams.get('shareToken');


    if (!userId || !goalId) {
      return new Response('Missing userId or goalId', { status: 400 });
    }

    const goalData = await fetchGoalData(userId, goalId, shareToken || undefined);

    // Default values
    const isPrivate = goalData?.isPrivate ?? false;
    const goalName = goalData?.goalName || 'Goal';
    const goalDescription = goalData?.goalDescription;
    const username = goalData?.username || 'User';
    const totalCards = goalData?.totalCards || 0;
    const collectedCards = goalData?.collectedCards || 0;
    const percentageCollected = goalData?.percentageCollected || 0;
    const totalValue = goalData?.totalValue || 0;
    const costToComplete = goalData?.costToComplete || 0;

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
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 30 }}>
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
            // Public Goal View
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
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 64,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {goalName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 32,
                      color: '#999999',
                    }}
                  >
                    Collection Goal by {username} on MTG CB
                  </div>
                </div>
              </div>

              {/* Goal Description if available */}
              {goalDescription && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 26,
                    color: '#cccccc',
                    marginTop: -10,
                    fontStyle: 'italic',
                  }}
                >
                  {goalDescription}
                </div>
              )}

              {/* Progress Bar Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 28,
                    color: '#999999',
                  }}
                >
                  Goal Progress
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    display: 'flex',
                    position: 'relative',
                    width: '100%',
                    height: 70,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 35,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${Math.min(percentageCollected, 100)}%`,
                      height: '100%',
                      background:
                        percentageCollected === 100
                          ? 'linear-gradient(90deg, #BF4427 0%, #E85D39 50%, #FFB347 100%)'
                          : 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 25,
                    }}
                  >
                    {percentageCollected > 10 && (
                      <div
                        style={{
                          display: 'flex',
                          fontSize: 34,
                          fontWeight: 600,
                          color: '#ffffff',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        }}
                      >
                        {Math.round(percentageCollected)}%
                      </div>
                    )}
                  </div>
                  {percentageCollected <= 10 && (
                    <div
                      style={{
                        display: 'flex',
                        position: 'absolute',
                        left: 25,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 34,
                        fontWeight: 600,
                        color: '#ffffff',
                      }}
                    >
                      {Math.round(percentageCollected)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div
                style={{
                  display: 'flex',
                  gap: 40,
                  marginTop: 20,
                }}
              >
                {/* Cards Progress */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 24,
                      color: '#999999',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}
                  >
                    Card Goals Met
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
                        fontSize: 64,
                        fontWeight: 700,
                        color: '#1976d2',
                      }}
                    >
                      {collectedCards}
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
                        fontSize: 64,
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {totalCards}
                    </div>
                  </div>
                </div>

                {/* Cost to Complete */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 24,
                      color: '#999999',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}
                  >
                    Cost to Complete
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 64,
                      fontWeight: 700,
                      color: costToComplete === 0 ? '#4caf50' : '#ff9800',
                    }}
                  >
                    {costToComplete === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Complete!</span>
                        <span style={{ fontSize: 48 }}>✨</span>
                      </div>
                    ) : (
                      `$${costToComplete.toFixed(2)}`
                    )}
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
      },
    );
  } catch (error) {
    return new Response(`Failed to generate image: ${(error as Error).message}`, { status: 500 });
  }
}
