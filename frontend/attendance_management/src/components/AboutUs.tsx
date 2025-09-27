import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type TeamMember = {
  name: string;
  position: string;
  description: string;
  avatar: string; // URL or local path
};

const teamMembers: TeamMember[] = [
  {
    name: "Phen Sokleng",
    position: "Project Manager",
    description: "Leads the team and manages project timelines.",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    name: "Bob Smith",
    position: "Frontend Developer",
    description: "Builds responsive and user-friendly interfaces.",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    name: "Charlie Brown",
    position: "Backend Developer",
    description: "Handles APIs and database integration.",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    name: "Diana Green",
    position: "UI/UX Designer",
    description: "Designs smooth and engaging user experiences.",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    name: "Ethan Lee",
    position: "DevOps Engineer",
    description: "Maintains CI/CD pipelines and server infrastructure.",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "Fiona Adams",
    position: "QA Engineer",
    description: "Ensures high quality through rigorous testing.",
    avatar: "https://i.pravatar.cc/150?img=6",
  },
  {
    name: "George White",
    position: "Fullstack Developer",
    description: "Works across frontend and backend systems.",
    avatar: "https://i.pravatar.cc/150?img=7",
  },
  {
    name: "Hannah Black",
    position: "Marketing Specialist",
    description: "Handles social media and outreach campaigns.",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    name: "Ian Clark",
    position: "Support Engineer",
    description: "Provides customer support and troubleshooting.",
    avatar: "https://i.pravatar.cc/150?img=9",
  },
  {
    name: "Julia King",
    position: "Data Analyst",
    description: "Analyzes data to guide business decisions.",
    avatar: "https://i.pravatar.cc/150?img=10",
  },
];

export const AboutUs: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-center">Our Team Member</h1>
        <p className="text-muted-foreground text-center">
          View Our Team
        </p>
      </div>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {teamMembers.map((member) => (
          <Card key={member.name}>
            <CardContent className="flex flex-col items-center text-center">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-24 h-24 rounded-full mb-4"
              />
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{member.position}</p>
              <p className="text-xs text-gray-600">{member.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
