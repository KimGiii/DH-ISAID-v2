import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  InvestmentProfileNotFoundError,
  ISAAccountNotFoundError,
  RebalancingService,
} from '@/services/isa/rebalancing-service';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: '인증되지 않은 사용자입니다.' },
      { status: 401 }
    );
  }

  const userId = BigInt(session.user.id);
  const rebalancingService = new RebalancingService({ prismaClient: prisma });

  try {
    const response =
      await rebalancingService.getRebalancingRecommendation(userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('리밸런싱 추천 조회 오류:', error);

    if (error instanceof InvestmentProfileNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof ISAAccountNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    // 더 구체적인 에러 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
    }

    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
