import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/auth/workspace";

type WorkflowAction =
  | "submit"
  | "send_client"
  | "request_changes"
  | "approve"
  | "schedule"
  | "publish";

type WorkflowBody = {
  action?: WorkflowAction;
  comment?: string;
};

type ContentStatus =
  | "draft"
  | "internal_review"
  | "changes_requested"
  | "client_review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

function isManagerRole(
  role: string
) {
  return (
    role === "admin" ||
    role === "manager"
  );
}

function isWorkflowAction(
  value: string
): value is WorkflowAction {
  return [
    "submit",
    "send_client",
    "request_changes",
    "approve",
    "schedule",
    "publish",
  ].includes(value);
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // --------------------------------------------------
    // 1. AUTHENTICATED WORKSPACE CONTEXT
    // --------------------------------------------------

    const workspace =
      await getWorkspaceContext();

    if (!workspace.data) {
      return NextResponse.json(
        {
          error:
            workspace.error ||
            "Workspace access denied.",
        },
        {
          status:
            workspace.status,
        }
      );
    }

    const { id } =
      await context.params;

    const body: WorkflowBody =
      await request.json();

    const action =
      body.action ?? "";

    const comment =
      body.comment?.trim() ||
      null;

    if (
      !isWorkflowAction(
        action
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid workflow action.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    // --------------------------------------------------
    // 2. LOAD CONTENT
    // --------------------------------------------------

    const {
      data: content,
      error: contentError,
    } =
      await admin
        .from("content_items")
        .select(
          `
          id,
          campaign_id,
          title,
          status,
          creator_id,
          publish_at
          `
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

    if (
      contentError ||
      !content
    ) {
      return NextResponse.json(
        {
          error:
            "Content item not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 3. LOAD CAMPAIGN
    // --------------------------------------------------

    const {
      data: campaign,
      error: campaignError,
    } =
      await admin
        .from("campaigns")
        .select(
          `
          id,
          organization_id,
          client_id,
          manager_id,
          name
          `
        )
        .eq(
          "id",
          content.campaign_id
        )
        .eq(
          "organization_id",
          workspace.data.organizationId
        )
        .maybeSingle();

    if (
      campaignError ||
      !campaign
    ) {
      return NextResponse.json(
        {
          error:
            "Content is outside your workspace.",
        },
        {
          status: 403,
        }
      );
    }

    const oldStatus =
      content.status as ContentStatus;

    let newStatus:
      ContentStatus | null =
        null;

    let approvalStage:
      "internal" | "client" | null =
        null;

    let approvalDecision:
      | "pending"
      | "approved"
      | "changes_requested"
      | null = null;

    let notificationType:
      | "info"
      | "approval"
      | "changes_requested"
      | "published"
      | null = null;

    let notificationTitle =
      "";

    let notificationMessage =
      "";

    let notificationRecipients:
      string[] = [];

    // --------------------------------------------------
    // 4. CLIENT MEMBERSHIP CHECK
    // --------------------------------------------------

    let isCampaignClient =
      false;

    if (
      workspace.data.role ===
      "client"
    ) {
      const {
        data: clientMembership,
      } =
        await admin
          .from(
            "client_members"
          )
          .select("id")
          .eq(
            "client_id",
            campaign.client_id
          )
          .eq(
            "profile_id",
            workspace.data.userId
          )
          .maybeSingle();

      isCampaignClient =
        Boolean(
          clientMembership
        );
    }

    // --------------------------------------------------
    // ACTION: SUBMIT FOR INTERNAL REVIEW
    // --------------------------------------------------

    if (
      action === "submit"
    ) {
      if (
        workspace.data.role ===
        "client"
      ) {
        return NextResponse.json(
          {
            error:
              "Client users cannot submit content.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        workspace.data.role ===
          "creator" &&
        content.creator_id !==
          workspace.data.userId
      ) {
        return NextResponse.json(
          {
            error:
              "You can only submit content assigned to you.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        oldStatus !==
          "draft" &&
        oldStatus !==
          "changes_requested"
      ) {
        return NextResponse.json(
          {
            error:
              "Only Draft or Changes Requested content can be submitted.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "internal_review";

      approvalStage =
        "internal";

      approvalDecision =
        "pending";

      notificationType =
        "approval";

      notificationTitle =
        "Content awaiting review";

      notificationMessage =
        `${content.title} was submitted for internal review.`;

      if (
        campaign.manager_id
      ) {
        notificationRecipients = [
          campaign.manager_id,
        ];
      } else {
        const {
          data:
            managementMembers,
        } =
          await admin
            .from(
              "organization_members"
            )
            .select(
              "profile_id"
            )
            .eq(
              "organization_id",
              workspace.data.organizationId
            )
            .eq(
              "is_active",
              true
            )
            .in(
              "role",
              [
                "admin",
                "manager",
              ]
            );

        notificationRecipients =
          (
            managementMembers ??
            []
          ).map(
            (member) =>
              member.profile_id
          );
      }
    }

    // --------------------------------------------------
    // ACTION: MANAGER APPROVES INTERNAL REVIEW
    //          AND SENDS TO CLIENT
    // --------------------------------------------------

    if (
      action ===
      "send_client"
    ) {
      if (
        !isManagerRole(
          workspace.data.role
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only Administrators and Managers can send content to a client.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        oldStatus !==
        "internal_review"
      ) {
        return NextResponse.json(
          {
            error:
              "Content must be in Internal Review before sending it to the client.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "client_review";

      approvalStage =
        "internal";

      approvalDecision =
        "approved";

      notificationType =
        "approval";

      notificationTitle =
        "Content ready for your review";

      notificationMessage =
        `${content.title} is ready for client approval.`;

      const {
        data:
          clientMembers,
      } =
        await admin
          .from(
            "client_members"
          )
          .select(
            "profile_id"
          )
          .eq(
            "client_id",
            campaign.client_id
          );

      notificationRecipients =
        (
          clientMembers ?? []
        ).map(
          (member) =>
            member.profile_id
        );
    }

    // --------------------------------------------------
    // ACTION: REQUEST CHANGES
    // --------------------------------------------------

    if (
      action ===
      "request_changes"
    ) {
      if (
        oldStatus ===
        "internal_review"
      ) {
        if (
          !isManagerRole(
            workspace.data.role
          )
        ) {
          return NextResponse.json(
            {
              error:
                "Only Administrators and Managers can request internal changes.",
            },
            {
              status: 403,
            }
          );
        }

        approvalStage =
          "internal";
      } else if (
        oldStatus ===
        "client_review"
      ) {
        if (
          workspace.data.role !==
            "client" ||
          !isCampaignClient
        ) {
          return NextResponse.json(
            {
              error:
                "Only the assigned Client may request changes during Client Review.",
            },
            {
              status: 403,
            }
          );
        }

        approvalStage =
          "client";
      } else {
        return NextResponse.json(
          {
            error:
              "Changes can only be requested during Internal Review or Client Review.",
          },
          {
            status: 400,
          }
        );
      }

      if (!comment) {
        return NextResponse.json(
          {
            error:
              "Please include the requested changes.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "changes_requested";

      approvalDecision =
        "changes_requested";

      notificationType =
        "changes_requested";

      notificationTitle =
        "Changes requested";

      notificationMessage =
        `${content.title}: ${comment}`;

      if (
        content.creator_id
      ) {
        notificationRecipients = [
          content.creator_id,
        ];
      }
    }

    // --------------------------------------------------
    // ACTION: CLIENT APPROVES
    // --------------------------------------------------

    if (
      action === "approve"
    ) {
      if (
        workspace.data.role !==
          "client" ||
        !isCampaignClient
      ) {
        return NextResponse.json(
          {
            error:
              "Only the assigned Client can give final approval.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        oldStatus !==
        "client_review"
      ) {
        return NextResponse.json(
          {
            error:
              "Content must be in Client Review before it can be approved.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "approved";

      approvalStage =
        "client";

      approvalDecision =
        "approved";

      notificationType =
        "approval";

      notificationTitle =
        "Content approved";

      notificationMessage =
        `${content.title} was approved by the client.`;

      notificationRecipients =
        [
          campaign.manager_id,
          content.creator_id,
        ].filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );
    }

    // --------------------------------------------------
    // ACTION: SCHEDULE
    // --------------------------------------------------

    if (
      action === "schedule"
    ) {
      if (
        !isManagerRole(
          workspace.data.role
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only Administrators and Managers can schedule content.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        oldStatus !==
        "approved"
      ) {
        return NextResponse.json(
          {
            error:
              "Only approved content can be scheduled.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !content.publish_at
      ) {
        return NextResponse.json(
          {
            error:
              "Set a planned publish date before scheduling this content.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "scheduled";

      notificationType =
        "info";

      notificationTitle =
        "Content scheduled";

      notificationMessage =
        `${content.title} has been scheduled for publishing.`;

      if (
        content.creator_id
      ) {
        notificationRecipients = [
          content.creator_id,
        ];
      }
    }

    // --------------------------------------------------
    // ACTION: PUBLISH
    // --------------------------------------------------

    if (
      action === "publish"
    ) {
      if (
        !isManagerRole(
          workspace.data.role
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Only Administrators and Managers can mark content as published.",
          },
          {
            status: 403,
          }
        );
      }

      if (
        oldStatus !==
        "scheduled"
      ) {
        return NextResponse.json(
          {
            error:
              "Only scheduled content can be marked as published.",
          },
          {
            status: 400,
          }
        );
      }

      newStatus =
        "published";

      notificationType =
        "published";

      notificationTitle =
        "Content published";

      notificationMessage =
        `${content.title} has been published.`;

      const {
        data:
          clientMembers,
      } =
        await admin
          .from(
            "client_members"
          )
          .select(
            "profile_id"
          )
          .eq(
            "client_id",
            campaign.client_id
          );

      notificationRecipients =
        [
          content.creator_id,

          ...(
            clientMembers ??
            []
          ).map(
            (member) =>
              member.profile_id
          ),
        ].filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );
    }

    // --------------------------------------------------
    // 5. SAFETY CHECK
    // --------------------------------------------------

    if (!newStatus) {
      return NextResponse.json(
        {
          error:
            "Workflow transition could not be determined.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 6. UPDATE CONTENT STATUS
    // --------------------------------------------------

    const {
      data: updatedContent,
      error: updateError,
    } =
      await admin
        .from(
          "content_items"
        )
        .update({
          status:
            newStatus,
        })
        .eq(
          "id",
          content.id
        )
        .select(
          `
          id,
          title,
          status,
          campaign_id,
          creator_id,
          publish_at,
          updated_at
          `
        )
        .single();

    if (updateError) {
      throw updateError;
    }

    // --------------------------------------------------
    // 7. APPROVAL HISTORY
    // --------------------------------------------------

    if (
      approvalStage &&
      approvalDecision
    ) {
      const {
        error:
          approvalError,
      } =
        await admin
          .from(
            "approvals"
          )
          .insert({
            content_id:
              content.id,

            stage:
              approvalStage,

            decision:
              approvalDecision,

            reviewer_id:
              approvalDecision ===
              "pending"
                ? null
                : workspace.data
                    .userId,

            comment,

            decided_at:
              approvalDecision ===
              "pending"
                ? null
                : new Date()
                    .toISOString(),
          });

      if (
        approvalError
      ) {
        console.warn(
          "Approval history warning:",
          approvalError.message
        );
      }
    }

    // --------------------------------------------------
    // 8. NOTIFICATIONS
    // --------------------------------------------------

    if (
      notificationType &&
      notificationRecipients
        .length > 0
    ) {
      const uniqueRecipients =
        Array.from(
          new Set(
            notificationRecipients
          )
        ).filter(
          (recipientId) =>
            recipientId !==
            workspace.data.userId
        );

      if (
        uniqueRecipients.length >
        0
      ) {
        const notificationRows =
          uniqueRecipients.map(
            (recipientId) => ({
              recipient_id:
                recipientId,

              type:
                notificationType,

              title:
                notificationTitle,

              message:
                notificationMessage,

              entity_type:
                "content",

              entity_id:
                content.id,
            })
          );

        const {
          error:
            notificationError,
        } =
          await admin
            .from(
              "notifications"
            )
            .insert(
              notificationRows
            );

        if (
          notificationError
        ) {
          console.warn(
            "Notification warning:",
            notificationError.message
          );
        }
      }
    }

    // --------------------------------------------------
    // 9. AUDIT LOG
    // --------------------------------------------------

    const {
      error: auditError,
    } =
      await admin
        .from(
          "audit_logs"
        )
        .insert({
          organization_id:
            workspace.data
              .organizationId,

          actor_id:
            workspace.data.userId,

          action:
            `content.${action}`,

          entity_type:
            "content",

          entity_id:
            content.id,

          metadata: {
            title:
              content.title,

            from_status:
              oldStatus,

            to_status:
              newStatus,

            comment,
          },
        });

    if (auditError) {
      console.warn(
        "Audit warning:",
        auditError.message
      );
    }

    // --------------------------------------------------
    // 10. RESPONSE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      action,

      fromStatus:
        oldStatus,

      toStatus:
        newStatus,

      content:
        updatedContent,
    });
  } catch (error) {
    console.error(
      "Content workflow error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to complete the workflow action.",
      },
      {
        status: 500,
      }
    );
  }
}