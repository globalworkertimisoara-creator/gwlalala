import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Building2, Users, Clock, Briefcase } from 'lucide-react';
import { ProjectWithMetrics, getProjectStatusColor, getProjectStatusLabel } from '@/types/project';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: ProjectWithMetrics;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {project.name}
          </CardTitle>
          <Badge className={getProjectStatusColor(project.status)}>
            {getProjectStatusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{project.employer_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{project.location}</span>
          </div>
          {project.sales_person_name && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">{project.sales_person_name}</span>
            </div>
          )}
        </div>

        {/* Contract countries */}
        {project.countries_in_contract.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.countries_in_contract.slice(0, 3).map(country => (
              <Badge key={country} variant="outline" className="text-xs">
                {country}
              </Badge>
            ))}
            {project.countries_in_contract.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.countries_in_contract.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fulfillment</span>
            <span className="font-medium">{project.fill_percentage}%</span>
          </div>
          <Progress value={project.fill_percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{project.filled_positions} placed</span>
            <span>{project.total_positions} total</span>
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            <span>{project.jobs.length} roles</span>
          </div>
          {project.days_since_contract !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{project.days_since_contract} days</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
